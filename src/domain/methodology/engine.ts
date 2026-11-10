/**
 * ADAPTIVE QUESTION ENGINE — base determinística.
 *
 * Este módulo:
 *  - garantiza una apertura amplia igual para todos,
 *  - calcula qué dimensiones faltan, qué intereses profundizar y qué tensiones aclarar,
 *  - propone una pregunta del banco (o una de "pasatiempo vs. vocación"),
 *  - decide cuándo hay información suficiente para terminar.
 *
 * En los puntos de control devuelve `plan`: el servidor consulta a la IA
 * (server/ai/question-planner.ts), que puede elegir otra pregunta del banco o
 * formular una nueva. Si la IA no está disponible o falla, se usa `fallback`.
 */
import { FACETS, INTEREST_FACETS, type DimensionId, type FacetKey } from "./dimensions";
import { HOBBY_PREFIX, hobbyItem } from "./hobby";
import { buildProfile, topFacets, type Profile } from "./profile";
import { OPENING_SEQUENCE, QUESTION_BANK } from "./question-bank";
import type { Item, Onboarding, Requirement, ResponseRecord } from "./types";

export const LIMITS = { min: 18, max: 40, maxGenerated: 8, requiredOpen: 2, hobbyProbes: 2 };

export type EngineOptions = { allowOpen: boolean; canGenerate: boolean };

export type Candidate = { item: Item; score: number; reason: string };

export type NextStep =
  | { type: "item"; item: Item; reason: string }
  | { type: "plan"; fallback: Candidate; candidates: Candidate[]; focus: FacetKey[]; gaps: DimensionId[] }
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

  // 1 · Apertura fija y amplia.
  for (const id of OPENING_SEQUENCE) {
    if (!asked.has(id)) {
      const item = QUESTION_BANK.find((i) => i.id === id)!;
      return { step: { type: "item", item, reason: "apertura" }, profile };
    }
  }

  if (n >= LIMITS.max) return { step: { type: "done", reason: "tope máximo" }, profile };

  const topInterests = topFacets(profile, "intereses", 3).map((f) => f.key);

  // Preguntas "pasatiempo o vocación" para los intereses más fuertes.
  const hobbyAsked = responses.filter((r) => r.itemId.startsWith(HOBBY_PREFIX)).length;
  const hobbyCandidates: Item[] =
    n >= 9 && hobbyAsked < LIMITS.hobbyProbes
      ? topInterests
          .slice(0, 2)
          .filter((k) => profile.facets[k].score >= 0.45 && !asked.has(`${HOBBY_PREFIX}${k}`))
          .map(hobbyItem)
      : [];

  const available: Item[] = [
    ...QUESTION_BANK.filter(
      (i) => !asked.has(i.id) && meets(i.requires, profile) && (opts.allowOpen || i.format !== "open"),
    ),
    ...hobbyCandidates,
  ];

  const pendingDeep = available.filter(
    (i) => i.kind === "deep" && i.probes?.some((k) => topInterests.slice(0, 2).includes(k)),
  );
  const pendingTension = profile.tensions.filter((k) => available.some((i) => i.probes?.includes(k)));
  const openAnswered = responses.filter((r) => r.answer.kind === "text").length;
  const generatedCount = responses.filter((r) => r.generatedItem).length;
  const gaps = (Object.entries(profile.coverage) as [DimensionId, { ratio: number }][])
    .filter(([, c]) => c.ratio < 1)
    .map(([d]) => d);
  const openMet = !opts.allowOpen || openAnswered >= LIMITS.requiredOpen;

  // 2 · ¿Información suficiente y equilibrada?
  if (
    n >= LIMITS.min &&
    gaps.length === 0 &&
    pendingDeep.length === 0 &&
    pendingTension.length === 0 &&
    hobbyCandidates.length === 0 &&
    openMet
  ) {
    return { step: { type: "done", reason: "evidencia suficiente" }, profile };
  }

  // 3 · Puntuar candidatos del banco.
  const last = responses.slice(-2).map((r) => QUESTION_BANK.find((i) => i.id === r.itemId));
  const lastWasText = responses[n - 1]?.answer.kind === "text";
  const scored: Candidate[] = available.map((item, idx) => {
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
    if (item.id.startsWith(HOBBY_PREFIX)) {
      score += 2.4;
      reason = "distinguir pasatiempo de vocación";
    }
    if (item.probes?.some((k) => pendingTension.includes(k))) {
      score += 2.5;
      reason = "aclarar respuestas que apuntan en direcciones distintas";
    }
    if (item.format === "open") {
      score += openAnswered < LIMITS.requiredOpen && n >= 8 ? 1.2 : -1;
      if (lastWasText) score -= 3; // no encadenar abiertas
    }
    if (item.dimension === "contexto") score -= n < 12 ? 2 : 0;
    if (last[1]?.dimension === item.dimension) score -= 1.5;
    if (last[0]?.format === item.format && last[1]?.format === item.format) score -= 0.6;
    score -= idx * 0.001;
    return { item, score, reason: reason || "complementar el perfil" };
  });
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return { step: { type: "done", reason: "sin ítems disponibles" }, profile };

  // 4 · Punto de control: la IA decide (elige del banco o formula una pregunta nueva).
  const checkpoint = n >= 4 && (lastWasText || n % 3 === 0);
  if (opts.canGenerate && checkpoint && generatedCount < LIMITS.maxGenerated) {
    return {
      step: { type: "plan", fallback: best, candidates: scored.slice(0, 18), focus: topInterests, gaps },
      profile,
    };
  }

  return { step: { type: "item", item: best.item, reason: best.reason }, profile };
}

/** Intereses que aparecen, pero que la persona no marcó al empezar. */
export function emergingInterests(profile: Profile, onboarding: Onboarding): FacetKey[] {
  return INTEREST_FACETS.filter(
    (k) => profile.facets[k].score >= 0.35 && !onboarding.areasConocidas.includes(k),
  );
}
