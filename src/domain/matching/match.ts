/**
 * CAREER MATCHING ENGINE (determinístico y explicable).
 *
 * Combina cuatro criterios:
 *  1. Afinidad personal  → intereses, modos de trabajo, motivaciones, valores, estilo de vida.
 *  2. Afinidad académica → habilidades percibidas y preferencias de estudio.
 *  3. Compatibilidad práctica → contexto vs. datos verificados de programas
 *     (PENDIENTE: requiere catálogo verificado; nunca descarta opciones).
 *  4. Descubrimiento → áreas afines que la persona no tenía en el radar.
 *
 * Los resultados se expresan con niveles cualitativos, nunca como porcentaje
 * ni como probabilidad de éxito.
 */
import { FACETS, type DimensionId, type FacetKey } from "../methodology/dimensions";
import { resolveItemById } from "./resolve";
import type { Profile } from "../methodology/profile";
import type { Onboarding, ResponseRecord } from "../methodology/types";
import { STUDY_FIELDS, type StudyField } from "../catalog/study-fields.draft";

const PERSONAL: DimensionId[] = ["intereses", "personalidad", "motivaciones", "valores", "estilo_vida"];
const ACADEMIC: DimensionId[] = ["habilidades", "academicas"];

export type AffinityLevel = "muy_marcada" | "clara" | "posible" | "exploratoria";

export const AFFINITY_LABEL: Record<AffinityLevel, string> = {
  muy_marcada: "Afinidad muy marcada",
  clara: "Afinidad clara",
  posible: "Afinidad posible",
  exploratoria: "Para explorar",
};

export type Reason = { facet: FacetKey; label: string; weight: number };
export type Support = { itemId: string; prompt: string; answer: string };

export type FieldMatch = {
  field: StudyField;
  kind: "principal" | "descubrimiento";
  level: AffinityLevel;
  personal: number;
  academic: number;
  combined: number;
  reasons: Reason[]; // qué se relaciona
  supports: Support[]; // qué respuestas lo respaldan
  misfits: Reason[]; // qué podría no encajar
  unexplored: string[]; // qué falta explorar
  related: string[]; // otras áreas cercanas
  practical: { status: "sin_datos"; note: string };
};

function affinity(field: StudyField, p: Profile, dims: DimensionId[]) {
  let num = 0;
  let den = 0;
  const contrib: Reason[] = [];
  for (const [k, w] of Object.entries(field.profile) as [FacetKey, number][]) {
    if (!dims.includes(FACETS[k].dimension)) continue;
    const f = p.facets[k];
    const c = w * f.score * (0.5 + 0.5 * f.confidence);
    num += c;
    den += Math.abs(w);
    contrib.push({ facet: k, label: FACETS[k].label, weight: c });
  }
  return { value: den ? num / den : 0, contrib };
}

function levelOf(x: number): AffinityLevel {
  if (x >= 0.4) return "muy_marcada";
  if (x >= 0.25) return "clara";
  if (x >= 0.12) return "posible";
  return "exploratoria";
}

function similarity(a: StudyField, b: StudyField): number {
  const keys = new Set([...Object.keys(a.profile), ...Object.keys(b.profile)]) as Set<FacetKey>;
  let dot = 0, na = 0, nb = 0;
  for (const k of keys) {
    const x = a.profile[k] ?? 0, y = b.profile[k] ?? 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  return dot / Math.sqrt(na * nb || 1);
}

function dominantInterest(field: StudyField): FacetKey | undefined {
  return (Object.entries(field.profile) as [FacetKey, number][])
    .filter(([k]) => FACETS[k].dimension === "intereses")
    .sort((a, b) => b[1] - a[1])[0]?.[0];
}

function buildMatch(
  field: StudyField,
  p: Profile,
  responses: ResponseRecord[],
  kind: FieldMatch["kind"],
): FieldMatch {
  const per = affinity(field, p, PERSONAL);
  const aca = affinity(field, p, ACADEMIC);
  const combined = 0.65 * per.value + 0.35 * aca.value;
  const all = [...per.contrib, ...aca.contrib];

  const reasons = all.filter((r) => r.weight > 0.05).sort((a, b) => b.weight - a.weight).slice(0, 4);
  const misfits = all.filter((r) => r.weight < -0.05).sort((a, b) => a.weight - b.weight).slice(0, 3);
  const unexplored = (Object.entries(field.profile) as [FacetKey, number][])
    .filter(([k, w]) => w >= 0.6 && p.facets[k].evidence.length === 0)
    .map(([k]) => FACETS[k].label);

  // Respuestas concretas que respaldan las principales razones.
  const seen = new Set<string>();
  const supports: Support[] = [];
  for (const r of reasons) {
    const ev = [...p.facets[r.facet].evidence].sort((a, b) => b.delta - a.delta);
    for (const e of ev) {
      if (e.delta <= 0 || seen.has(e.itemId)) continue;
      seen.add(e.itemId);
      const prompt = e.itemId === "onboarding"
        ? "Áreas que tenías en mente al empezar"
        : resolveItemById(e.itemId, responses)?.prompt ?? "";
      supports.push({ itemId: e.itemId, prompt, answer: e.answerLabel });
      break;
    }
    if (supports.length >= 3) break;
  }

  const related = STUDY_FIELDS.filter((f) => f.id !== field.id)
    .map((f) => ({ f, s: similarity(field, f) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 2)
    .map((x) => x.f.name);

  return {
    field, kind, level: levelOf(combined),
    personal: per.value, academic: aca.value, combined,
    reasons, supports, misfits, unexplored, related,
    practical: {
      status: "sin_datos",
      note: "Todavía no cargamos instituciones verificadas para esta área. Cuando estén, vas a ver dónde estudiarla, modalidad y sedes.",
    },
  };
}

export function matchFields(p: Profile, responses: ResponseRecord[], onboarding: Onboarding) {
  const ranked = STUDY_FIELDS.map((f) => buildMatch(f, p, responses, "principal")).sort(
    (a, b) => b.combined - a.combined,
  );

  const principal = ranked.filter((m, i) => i < 5 && (m.combined >= 0.12 || i < 3));

  const topInterests = new Set(
    (Object.values(p.facets))
      .filter((f) => FACETS[f.key].dimension === "intereses")
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((f) => f.key),
  );
  const known = new Set(onboarding.areasConocidas);

  // Descubrimiento: afinidad por cómo te gusta trabajar y qué te mueve,
  // aunque el área en sí no haya aparecido entre tus intereses marcados.
  const discovery = ranked
    .slice(principal.length, 16)
    .filter((m) => {
      const dom = dominantInterest(m.field);
      if (dom && (topInterests.has(dom) || known.has(dom))) return false;
      const nonInterest = m.reasons.filter((r) => FACETS[r.facet].dimension !== "intereses");
      return nonInterest.length >= 2 && m.combined > 0.05;
    })
    .slice(0, 2)
    .map((m) => ({ ...m, kind: "descubrimiento" as const }));

  return { principal, discovery };
}
