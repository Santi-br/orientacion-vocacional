/**
 * CAREER MATCHING — capa determinística.
 *
 * 1. Afinidad por campo de estudio (personal + académica) a partir de las facetas.
 * 2. Preselección de carreras CANDIDATAS del catálogo verificado (las más afines
 *    + algunas de campos poco obvios para habilitar descubrimientos).
 * 3. Recomendaciones de respaldo cuando la IA no está disponible.
 * 4. Información práctica (instituciones, sector, sedes) — solo datos verificados.
 *
 * La IA (server/ai/career-matcher.ts) elige y explica sobre las candidatas;
 * nunca puede recomendar algo fuera del catálogo.
 */
import { FACETS, type DimensionId, type FacetKey } from "../methodology/dimensions";
import type { Profile } from "../methodology/profile";
import type { Context, Onboarding, ResponseRecord } from "../methodology/types";
import { CATALOG, CAREER_BY_ID, INSTITUTION_BY_ID, programsOf, type Career } from "../catalog/catalog";
import { STUDY_FIELDS, type StudyField } from "../catalog/study-fields";
import type { AffinityLevel, EvidenceRef, InstitutionOffer, Recommendation } from "../report/types";
import { resolveItemById } from "./resolve";

const PERSONAL: DimensionId[] = ["intereses", "personalidad", "motivaciones", "valores", "estilo_vida"];
const ACADEMIC: DimensionId[] = ["habilidades", "academicas"];

export type Contribution = { facet: FacetKey; label: string; weight: number };

export type FieldAffinity = {
  field: StudyField;
  personal: number;
  academic: number;
  combined: number;
  contributions: Contribution[];
};

function affinity(field: StudyField, p: Profile, dims: DimensionId[]) {
  let num = 0;
  let den = 0;
  const contrib: Contribution[] = [];
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

export function fieldAffinities(p: Profile): Map<string, FieldAffinity> {
  const out = new Map<string, FieldAffinity>();
  for (const field of STUDY_FIELDS) {
    const per = affinity(field, p, PERSONAL);
    const aca = affinity(field, p, ACADEMIC);
    out.set(field.id, {
      field,
      personal: per.value,
      academic: aca.value,
      combined: 0.65 * per.value + 0.35 * aca.value,
      contributions: [...per.contrib, ...aca.contrib],
    });
  }
  return out;
}

export type ScoredCareer = { career: Career; score: number; bestField: FieldAffinity };

export function scoreCareers(p: Profile): ScoredCareer[] {
  const fa = fieldAffinities(p);
  return CATALOG.careers
    .map((career) => {
      const fields = career.fields.map((f) => fa.get(f)).filter(Boolean) as FieldAffinity[];
      const bestField = fields.sort((a, b) => b.combined - a.combined)[0];
      // Varias áreas afines a la vez suman un poco (carreras "puente").
      const second = fields[1]?.combined ?? 0;
      const score = (bestField?.combined ?? -1) + Math.max(0, second) * 0.25;
      return { career, score, bestField };
    })
    .filter((s) => s.bestField)
    .sort((a, b) => b.score - a.score);
}

/**
 * Candidatas para la IA: las más afines + la mejor carrera de cada campo
 * que quedó afuera (para que la IA pueda proponer relaciones no obvias).
 */
export function selectCandidates(p: Profile, limit = 55): ScoredCareer[] {
  const ranked = scoreCareers(p);
  const out = ranked.slice(0, Math.round(limit * 0.7));
  const seenFields = new Set(out.flatMap((s) => s.career.fields));
  for (const s of ranked.slice(out.length)) {
    if (out.length >= limit) break;
    if (s.career.fields.some((f) => !seenFields.has(f))) {
      out.push(s);
      s.career.fields.forEach((f) => seenFields.add(f));
    }
  }
  for (const s of ranked.slice(out.length)) {
    if (out.length >= limit) break;
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

export function levelOf(x: number): AffinityLevel {
  if (x >= 0.4) return "muy_marcada";
  if (x >= 0.25) return "clara";
  if (x >= 0.12) return "posible";
  return "exploratoria";
}

/** Instituciones verificadas donde se ofrece la carrera + compatibilidad práctica (nunca excluye). */
export function institutionsFor(careerId: string, context: Partial<Context>): InstitutionOffer[] {
  const byInst = new Map<string, InstitutionOffer>();
  for (const prog of programsOf(careerId)) {
    const inst = INSTITUTION_BY_ID.get(prog.institutionId)!;
    const campuses = inst.campuses.filter((c) => c.role === "sede");
    const offer = byInst.get(inst.id) ?? {
      institutionId: inst.id,
      shortName: inst.shortName,
      name: inst.name,
      sector: inst.sector,
      website: inst.website,
      programs: [],
      campuses: campuses.map((c) => ({ name: c.name, address: c.address, zone: c.zone })),
      matchesSector:
        context.gestion === "publica" || context.gestion === "privada" ? context.gestion === inst.sector : null,
      campusInZone: campuses.length && context.zona ? campuses.some((c) => c.zone === context.zona) : null,
    };
    offer.programs.push({
      officialName: prog.displayName,
      units: prog.units.map((u) => u.name),
      level: prog.level,
      orientations: prog.orientations,
      startNote: prog.startNote,
      source: prog.source,
      verifiedAt: prog.verifiedAt,
    });
    byInst.set(inst.id, offer);
  }
  // Primero las que coinciden con la preferencia de sector; el resto se muestra igual.
  return [...byInst.values()].sort((a, b) => Number(b.matchesSector ?? 0) - Number(a.matchesSector ?? 0));
}

export const PENDING_DATA = ["duración", "título", "sedes de dictado", "modalidad", "ingreso", "aranceles y becas", "plan de estudios"];

export function relatedCareers(careerId: string, pool: ScoredCareer[], n = 3) {
  const c = CAREER_BY_ID.get(careerId);
  if (!c) return [];
  const isProf = (x: Career) => x.levels.includes("profesorado");
  return pool
    .filter((s) => s.career.id !== careerId && s.career.fields.some((f) => c.fields.includes(f)))
    .filter((s) => isProf(s.career) === isProf(c)) // no mezclar profesorados con carreras de grado
    .slice(0, n)
    .map((s) => ({ careerId: s.career.id, name: s.career.name }));
}

function evidenceFor(contribs: Contribution[], p: Profile, responses: ResponseRecord[]): EvidenceRef[] {
  const seen = new Set<string>();
  const out: EvidenceRef[] = [];
  for (const r of contribs) {
    const ev = [...p.facets[r.facet].evidence].sort((a, b) => b.delta - a.delta);
    for (const e of ev) {
      if (e.delta <= 0 || seen.has(e.itemId)) continue;
      seen.add(e.itemId);
      const prompt =
        e.itemId === "onboarding"
          ? "Áreas que tenías en mente al empezar"
          : resolveItemById(e.itemId, responses)?.prompt ?? "";
      out.push({ itemId: e.itemId, prompt, answer: e.answerLabel, note: `Se relaciona con ${r.label}.` });
      break;
    }
    if (out.length >= 3) break;
  }
  return out;
}

/** Recomendaciones sin IA: transparentes, basadas en las reglas. */
export function deterministicRecommendations(
  p: Profile,
  responses: ResponseRecord[],
  onboarding: Onboarding,
): { principal: Recommendation[]; discovery: Recommendation[] } {
  const ranked = scoreCareers(p);
  const fieldCount = new Map<string, number>();
  const principal: ScoredCareer[] = [];
  for (const s of ranked) {
    if (principal.length >= 6) break;
    const f = s.bestField.field.id;
    if ((fieldCount.get(f) ?? 0) >= 2) continue; // variedad: no más de 2 por campo
    fieldCount.set(f, (fieldCount.get(f) ?? 0) + 1);
    principal.push(s);
  }

  const topInterests = new Set(
    Object.values(p.facets)
      .filter((f) => FACETS[f.key].dimension === "intereses")
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((f) => f.key),
  );
  const known = new Set(onboarding.areasConocidas);
  const discovery = ranked
    .filter((s) => !principal.includes(s) && !principal.some((x) => x.bestField.field.id === s.bestField.field.id))
    .filter((s) => {
      const dom = (Object.entries(s.bestField.field.profile) as [FacetKey, number][])
        .filter(([k]) => FACETS[k].dimension === "intereses")
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      if (dom && (topInterests.has(dom) || known.has(dom))) return false;
      return s.bestField.contributions.filter((c) => c.weight > 0.05 && FACETS[c.facet].dimension !== "intereses").length >= 2;
    })
    .slice(0, 2);

  const toRec = (s: ScoredCareer, kind: Recommendation["kind"]): Recommendation => {
    const c = s.bestField.contributions;
    const reasons = c.filter((r) => r.weight > 0.05).sort((a, b) => b.weight - a.weight).slice(0, 4);
    const misfits = c.filter((r) => r.weight < -0.05).sort((a, b) => a.weight - b.weight).slice(0, 3);
    const unexplored = (Object.entries(s.bestField.field.profile) as [FacetKey, number][])
      .filter(([k, w]) => w >= 0.6 && p.facets[k].evidence.length === 0)
      .map(([k]) => FACETS[k].label);
    return {
      careerId: s.career.id,
      name: s.career.name,
      kind,
      level: kind === "descubrimiento" ? "exploratoria" : levelOf(s.score),
      why:
        kind === "descubrimiento"
          ? `No está entre tus intereses más marcados, pero se conecta con ${reasons.map((r) => r.label).slice(0, 2).join(" y ")}.`
          : `Se relaciona con ${reasons.map((r) => r.label).slice(0, 3).join(", ")}.`,
      evidence: evidenceFor(reasons, p, responses),
      matchingInterests: reasons.map((r) => r.label),
      activities: [],
      misfits: misfits.map((r) => `Suele pedir ${r.label}, y tus respuestas fueron por otro lado.`),
      unknowns: unexplored.map((u) => `Cómo te llevás con ${u}.`),
      related: relatedCareers(s.career.id, ranked),
      institutions: institutionsFor(s.career.id, p.context),
      pendingData: PENDING_DATA,
    };
  };

  return { principal: principal.map((s) => toRec(s, "principal")), discovery: discovery.map((s) => toRec(s, "descubrimiento")) };
}
