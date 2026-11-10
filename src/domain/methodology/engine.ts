/**
 * ADAPTIVE QUESTION ENGINE (selección determinística).
 *
 * No termina por cantidad fija: cierra cuando hay evidencia suficiente y
 * equilibrada en las 8 dimensiones, se profundizó en los intereses más
 * marcados y no quedan tensiones sin explorar (con topes mínimo y máximo).
 *
 * La IA puede *formular* una pregunta abierta de seguimiento (directiva
 * "generate"), pero la decisión de cuándo y sobre qué la toma este motor.
 */
import { FACETS, INTEREST_FACETS, type DimensionId, type FacetKey } from "./dimensions";
import { buildProfile, topFacets, type Profile } from "./profile";
import { OPENING_SEQUENCE, QUESTION_BANK } from "./question-bank";
import type { Item, Onboarding, Requirement, ResponseRecord } from "./types";

export const LIMITS = { min: 18, max: 42, maxGenerated: 2, requiredOpen: 2 };

export type EngineOptions = { allowOpen: boolean; canGenerate: boolean };

export type NextStep =
  | { type: "item"; item: Item; reason: string }
  | { type: "generate"; dimension: DimensionId; focus: FacetKey[]; reason: string }
  | { type: "done"; reason: string };

function meets(req: Requirement | undefined, p: Profile): boolean {
  if (!req) return true;
  if ("facetAtLeast" in req) {
    const [k, min] = req.facetAtLeast;
    return p.facets[k].score >= min;
  }
  const [keys, min] = req.anyFacetAtLeast;
  return keys.some((k) => p.facets[k].score >= min);
}

export function nextStep(
  responses: ResponseRecord[],
  onboarding: Onboarding,
  opts: EngineOptions,
): { step: NextStep; profile: Profile } {
  const profile = buildProfile(responses, onboarding);
  const asked = new Set(responses.map((r) => r.itemId));
  const n = responses.length;

  // 1 · Apertura fija y amplia, igual para todos.
  for (const id of OPENING_SEQUENCE) {
    if (!asked.has(id)) {
      const item = QUESTION_BANK.find((i) => i.id === id)!;
      return { step: { type: "item", item, reason: "apertura" }, profile };
    }
  }

  if (n >= LIMITS.max) return { step: { type: "done", reason: "tope máximo" }, profile };

  const available = QUESTION_BANK.filter(
    (i) => !asked.has(i.id) && meets(i.requires, profile) && (opts.allowOpen || i.format !== "open"),
  );

  const topInterests = topFacets(profile, "intereses", 3).map((f) => f.key);
  const pendingDeep = available.filter(
    (i) => i.kind === "deep" && i.probes?.some((k) => topInterests.slice(0, 2).includes(k)),
  );
  const pendingTension = profile.tensions.filter((k) => available.some((i) => i.probes?.includes(k)));
  const openAnswered = responses.filter((r) => r.answer.kind === "text").length;
  const generatedCount = responses.filter((r) => r.generatedItem).length;
  const coverageMet = Object.values(profile.coverage).every((c) => c.ratio >= 1);
  const openMet = !opts.allowOpen || openAnswered >= LIMITS.requiredOpen;

  // 2 · ¿Ya hay información suficiente y equilibrada?
  if (n >= LIMITS.min && coverageMet && pendingDeep.length === 0 && pendingTension.length === 0 && openMet) {
    return { step: { type: "done", reason: "evidencia suficiente" }, profile };
  }

  // 3 · Pregunta abierta generada (si corresponde): profundiza en el patrón dominante.
  if (
    opts.allowOpen &&
    opts.canGenerate &&
    n >= 14 &&
    generatedCount < LIMITS.maxGenerated &&
    topInterests.length >= 2 &&
    responses[n - 1]?.answer.kind !== "text" &&
    n % 7 === 0
  ) {
    return {
      step: { type: "generate", dimension: "intereses", focus: topInterests.slice(0, 2), reason: "profundizar patrón" },
      profile,
    };
  }

  // 4 · Puntuar candidatos.
  const last = responses.slice(-2).map((r) => QUESTION_BANK.find((i) => i.id === r.itemId));
  let best: { item: Item; score: number; reason: string } | undefined;
  available.forEach((item, idx) => {
    let score = 0;
    let reason = "";
    const cov = profile.coverage[item.dimension];
    const need = (cov.target - Math.min(cov.answered, cov.target)) / cov.target;
    score += need * 3;
    if (need > 0) reason = `cubrir ${item.dimension}`;

    if (item.kind === "deep" && item.probes?.some((k) => topInterests.includes(k))) {
      score += 2.2;
      reason = `profundizar en ${item.probes.map((k) => FACETS[k].label).join(" / ")}`;
    }
    if (item.probes?.some((k) => pendingTension.includes(k))) {
      score += 2.5;
      reason = "aclarar respuestas que apuntan en direcciones distintas";
    }
    if (item.format === "open") {
      score += openAnswered < LIMITS.requiredOpen && n >= 8 ? 1.2 : -1;
      if (responses[n - 1]?.answer.kind === "text") score -= 3; // no encadenar abiertas
    }
    if (item.dimension === "contexto") score -= n < 12 ? 2 : 0; // contexto hacia el final
    if (last[1]?.dimension === item.dimension) score -= 1.5; // variedad
    if (last[0]?.format === item.format && last[1]?.format === item.format) score -= 0.6;
    score -= idx * 0.001; // desempate estable (orden del banco)

    if (!best || score > best.score) best = { item, score, reason: reason || "complementar el perfil" };
  });

  if (!best) return { step: { type: "done", reason: "sin ítems disponibles" }, profile };
  return { step: { type: "item", item: best.item, reason: best.reason }, profile };
}

/** Intereses que aparecen, pero que la persona no marcó al empezar. */
export function emergingInterests(profile: Profile, onboarding: Onboarding): FacetKey[] {
  return INTEREST_FACETS.filter(
    (k) => profile.facets[k].score >= 0.35 && !onboarding.areasConocidas.includes(k),
  );
}
