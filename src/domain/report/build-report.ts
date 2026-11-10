/**
 * Informe base (sin IA). Es el respaldo cuando la IA no está disponible y la
 * estructura sobre la que la IA trabaja cuando sí lo está.
 */
import { CATALOG_VERSION } from "../catalog/catalog";
import { DIMENSIONS, FACETS, METHODOLOGY_VERSION } from "../methodology/dimensions";
import { emergingInterests } from "../methodology/engine";
import { buildProfile, topFacets, type Profile } from "../methodology/profile";
import type { Onboarding, ResponseRecord } from "../methodology/types";
import { deterministicRecommendations } from "../matching/match";
import type { ExploratoryProfile, Report } from "./types";

const CONTEXT_LABELS: Record<string, Record<string, string>> = {
  zona: { caba: "CABA", gba_norte: "GBA Norte", gba_oeste: "GBA Oeste", gba_sur: "GBA Sur", otra: "Otra zona" },
  gestion: { publica: "Prefiere institución pública", privada: "Prefiere institución privada", indistinto: "Pública o privada, indistinto", no_se: "Todavía no sabe si pública o privada" },
  trabajo: { si: "Piensa trabajar mientras estudia", quizas: "Quizás trabaje mientras estudia", no: "No piensa trabajar mientras estudia" },
  modalidad: { presencial: "Prefiere modalidad presencial", virtual: "Prefiere modalidad virtual", mixta: "Prefiere modalidad mixta", indistinto: "Modalidad indistinta" },
};

export function contextLabels(p: Profile): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(p.context)) {
    const label = CONTEXT_LABELS[k]?.[v as string];
    if (label) out[k] = label;
  }
  return out;
}

export function highlightsOf(p: Profile) {
  return DIMENSIONS.filter((d) => d.id !== "contexto")
    .map((d) => ({ dimension: d.id, label: d.short, items: topFacets(p, d.id, 3).map((f) => FACETS[f.key].label) }))
    .filter((h) => h.items.length > 0);
}

/** Une dos frases que ya pueden contener "y" sin que se lea "x y y". */
function pair(xs: string[], prep = "") {
  return xs.length === 2 ? `${xs[0]}, y también ${prep}${xs[1]}` : xs.join("");
}

export function deterministicProfile(p: Profile, onboarding: Onboarding): ExploratoryProfile {
  const interests = topFacets(p, "intereses", 5);
  const modes = topFacets(p, "personalidad", 2).map((f) => FACETS[f.key].label);
  const mot = topFacets(p, "motivaciones", 1).map((f) => FACETS[f.key].label);
  const parts: string[] = [];
  if (interests.length) parts.push(`Te atraen temas de ${pair(interests.slice(0, 2).map((f) => FACETS[f.key].label), "de ")}.`);
  if (modes.length) parts.push(`Disfrutás ${pair(modes)}.`);
  if (mot.length) parts.push(`Y te mueve ${mot[0]}.`);
  return {
    summary: parts.join(" ") || "Estas son las carreras que más se relacionan con lo que contaste.",
    primary: interests.slice(0, 2).map((f) => ({ label: FACETS[f.key].label, detail: "" })),
    secondary: interests.slice(2).map((f) => ({ label: FACETS[f.key].label, detail: "" })),
    combinations: [],
    hobbies: [],
    tensions: p.tensions.map((k) => ({
      label: FACETS[k].label,
      detail: "Respondiste en direcciones distintas. Puede depender del contexto.",
    })),
    unexplored: [
      ...emergingInterests(p, onboarding).map((k) => `Apareció sin que lo marcaras: ${FACETS[k].label}`),
      ...DIMENSIONS.filter((d) => p.coverage[d.id].ratio < 1).map((d) => `Quedó menos información sobre: ${d.label.toLowerCase()}`),
    ],
  };
}

export function buildReport(responses: ResponseRecord[], onboarding: Onboarding): Report {
  const profile = buildProfile(responses, onboarding);
  const { principal, discovery } = deterministicRecommendations(profile, responses, onboarding);
  return {
    methodologyVersion: METHODOLOGY_VERSION,
    catalogVersion: CATALOG_VERSION,
    generatedAt: new Date().toISOString(),
    answeredCount: profile.answeredCount,
    engine: { mode: "reglas", trace: [] },
    profile: deterministicProfile(profile, onboarding),
    highlights: highlightsOf(profile),
    context: contextLabels(profile),
    principal,
    discovery,
  };
}
