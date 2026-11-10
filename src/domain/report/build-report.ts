/**
 * REPORT GENERATOR (estructura determinística).
 * La IA, si está habilitada, solo redacta un párrafo de síntesis a partir de
 * este objeto; nunca agrega carreras, instituciones ni datos académicos.
 */
import { DIMENSIONS, FACETS, METHODOLOGY_VERSION, type DimensionId, type FacetKey } from "../methodology/dimensions";
import { emergingInterests } from "../methodology/engine";
import { buildProfile, topFacets } from "../methodology/profile";
import type { Onboarding, ResponseRecord } from "../methodology/types";
import { matchFields, type FieldMatch } from "../matching/match";

export type Report = {
  methodologyVersion: string;
  generatedAt: string;
  answeredCount: number;
  highlights: { dimension: DimensionId; label: string; items: string[] }[];
  emerging: string[];
  tensions: { facet: FacetKey; label: string }[];
  gaps: string[];
  context: Record<string, string>;
  principal: FieldMatch[];
  discovery: FieldMatch[];
  narrative?: string;
};

const CONTEXT_LABELS: Record<string, Record<string, string>> = {
  zona: { caba: "CABA", gba_norte: "GBA Norte", gba_oeste: "GBA Oeste", gba_sur: "GBA Sur", otra: "Otra zona" },
  gestion: { publica: "Prefiere institución pública", privada: "Prefiere institución privada", indistinto: "Pública o privada, indistinto", no_se: "Todavía no sabe si pública o privada" },
  trabajo: { si: "Piensa trabajar mientras estudia", quizas: "Quizás trabaje mientras estudia", no: "No piensa trabajar mientras estudia" },
  modalidad: { presencial: "Prefiere modalidad presencial", virtual: "Prefiere modalidad virtual", mixta: "Prefiere modalidad mixta", indistinto: "Modalidad indistinta" },
};

export function buildReport(responses: ResponseRecord[], onboarding: Onboarding): Report {
  const profile = buildProfile(responses, onboarding);
  const { principal, discovery } = matchFields(profile, responses, onboarding);

  const highlights = DIMENSIONS.filter((d) => d.id !== "contexto")
    .map((d) => ({
      dimension: d.id,
      label: d.short,
      items: topFacets(profile, d.id, 3).map((f) => FACETS[f.key].label),
    }))
    .filter((h) => h.items.length > 0);

  const gaps = DIMENSIONS.filter((d) => profile.coverage[d.id].ratio < 1).map((d) => d.label);

  const context: Record<string, string> = {};
  for (const [k, v] of Object.entries(profile.context)) {
    const label = CONTEXT_LABELS[k]?.[v as string];
    if (label) context[k] = label;
  }

  return {
    methodologyVersion: METHODOLOGY_VERSION,
    generatedAt: new Date().toISOString(),
    answeredCount: profile.answeredCount,
    highlights,
    emerging: emergingInterests(profile, onboarding).map((k) => FACETS[k].label),
    tensions: profile.tensions.map((k) => ({ facet: k, label: FACETS[k].label })),
    gaps,
    context,
    principal,
    discovery,
  };
}
