/**
 * PROFILE ANALYZER (parte determinística).
 * Convierte respuestas en un perfil estructurado: puntaje por faceta,
 * evidencia trazable (qué respuesta aportó qué), cobertura por dimensión
 * y tensiones (señales a favor y en contra de una misma faceta).
 *
 * La IA no reemplaza este cálculo: solo aporta señales de respuestas abiertas,
 * validadas contra las facetas conocidas.
 */
import {
  COVERAGE_TARGET,
  DIMENSIONS,
  FACET_KEYS,
  FACETS,
  type DimensionId,
  type FacetKey,
} from "./dimensions";
import { ITEM_BY_ID } from "./question-bank";
import type { Context, Item, Onboarding, ResponseRecord, Signals } from "./types";

export type Evidence = { itemId: string; delta: number; answerLabel: string };

export type FacetScore = {
  key: FacetKey;
  score: number; // -1..1 (tanh de la suma de evidencia)
  confidence: number; // 0..1, crece con la cantidad de evidencia
  evidence: Evidence[];
  tension: boolean;
};

export type Profile = {
  facets: Record<FacetKey, FacetScore>;
  coverage: Record<DimensionId, { answered: number; target: number; ratio: number }>;
  context: Partial<Context>;
  tensions: FacetKey[];
  answeredCount: number;
};

export function resolveItem(r: ResponseRecord): Item | undefined {
  return r.generatedItem ?? ITEM_BY_ID.get(r.itemId);
}

/** Señales + etiqueta legible de una respuesta. */
export function interpret(item: Item, r: ResponseRecord): { signals: Signals; label: string }[] {
  const a = r.answer;
  if (a.kind === "skip") return [];
  switch (item.format) {
    case "single":
    case "scenario":
    case "multi":
    case "context": {
      if (a.kind !== "choice") return [];
      return item.options
        .filter((op) => a.optionIds.includes(op.id))
        .map((op) => ({ signals: op.signals ?? {}, label: op.label }));
    }
    case "likert": {
      if (a.kind !== "scale") return [];
      const f = (a.value - 3) / 2; // 1..5 → -1..1
      return [{ signals: scale(item.signals, f), label: LIKERT_LABELS[a.value - 1] ?? "" }];
    }
    case "bipolar": {
      if (a.kind !== "scale") return [];
      const v = a.value; // -2..2
      if (v === 0) return [{ signals: {}, label: "En el medio" }];
      const side = v < 0 ? item.left : item.right;
      return [{ signals: scale(side.signals, Math.abs(v) / 2), label: side.label }];
    }
    case "open": {
      if (a.kind !== "text" || !r.derived) return [];
      const label = r.derived.themes.length ? `Mencionaste: ${r.derived.themes.join(", ")}` : "Respuesta abierta";
      return [{ signals: r.derived.signals, label }];
    }
  }
}

export const LIKERT_LABELS = ["Nada", "Poco", "Más o menos", "Bastante", "Mucho"];

function scale(s: Signals, f: number): Signals {
  const out: Signals = {};
  for (const [k, w] of Object.entries(s)) out[k as FacetKey] = (w ?? 0) * f;
  return out;
}

export function buildProfile(responses: ResponseRecord[], onboarding?: Onboarding): Profile {
  const facets = Object.fromEntries(
    FACET_KEYS.map((k) => [k, { key: k, score: 0, confidence: 0, evidence: [] as Evidence[], tension: false }]),
  ) as Record<FacetKey, FacetScore>;

  const coverageCount = Object.fromEntries(DIMENSIONS.map((d) => [d.id, 0])) as Record<DimensionId, number>;
  const context: Partial<Context> = {};
  if (onboarding) {
    context.zona = onboarding.zona;
    coverageCount.contexto += 1;
    // Áreas que la persona ya tiene en mente: evidencia leve, declarada.
    for (const k of onboarding.areasConocidas) {
      facets[k].evidence.push({ itemId: "onboarding", delta: 0.6, answerLabel: "Lo marcaste al empezar" });
    }
  }

  let answeredCount = 0;
  for (const r of responses) {
    const item = resolveItem(r);
    if (!item) continue;
    answeredCount += 1;
    if (r.answer.kind === "skip") continue;

    if (item.format === "context" && r.answer.kind === "choice") {
      for (const op of item.options) if (r.answer.optionIds.includes(op.id)) Object.assign(context, op.context);
      coverageCount.contexto += 1;
      continue;
    }

    const parts = interpret(item, r);
    // Una respuesta abierta sin análisis no aporta evidencia ni cobertura.
    if (parts.length === 0) continue;
    coverageCount[item.dimension] += 1;
    for (const { signals, label } of parts) {
      for (const [k, delta] of Object.entries(signals)) {
        if (!delta || !(k in facets)) continue;
        facets[k as FacetKey].evidence.push({ itemId: r.itemId, delta, answerLabel: label });
      }
    }
  }

  const tensions: FacetKey[] = [];
  for (const f of Object.values(facets)) {
    const sum = f.evidence.reduce((s, e) => s + e.delta, 0);
    const n = f.evidence.length;
    f.score = Math.tanh(sum / 3);
    f.confidence = n / (n + 2);
    f.tension = f.evidence.some((e) => e.delta >= 0.75) && f.evidence.some((e) => e.delta <= -0.75);
    if (f.tension) tensions.push(f.key);
  }

  const coverage = Object.fromEntries(
    DIMENSIONS.map((d) => {
      const target = COVERAGE_TARGET[d.id];
      const answered = coverageCount[d.id];
      return [d.id, { answered, target, ratio: Math.min(1, answered / target) }];
    }),
  ) as Profile["coverage"];

  return { facets, coverage, context, tensions, answeredCount };
}

export function topFacets(p: Profile, dimension: DimensionId, n = 3): FacetScore[] {
  return Object.values(p.facets)
    .filter((f) => FACETS[f.key].dimension === dimension && f.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export function overallCoverage(p: Profile): number {
  const vals = Object.values(p.coverage);
  return vals.reduce((s, c) => s + c.ratio, 0) / vals.length;
}
