/**
 * Catálogo académico verificado (fuente: data/catalog/institutions/*.json).
 *
 * Modelo normalizado — no confundir:
 *   Institution (universidad)  →  AcademicUnit (facultad / escuela / departamento / área del sitio)
 *   Program (oferta: nombre oficial, en una institución)  →  Career (agrupación editorial entre instituciones)
 *   Campus (sede)  ·  modalidad, título, duración: por oferta, hoy "pendiente" salvo que la fuente lo diga.
 *
 * Todo dato institucional sale del JSON con su URL y fecha. Lo editorial
 * (nivel, campos, agrupación) se calcula en classify.ts y se marca como tal.
 */
import uba from "../../../data/catalog/institutions/uba.json";
import utnBa from "../../../data/catalog/institutions/utn-ba.json";
import unsam from "../../../data/catalog/institutions/unsam.json";
import unlam from "../../../data/catalog/institutions/unlam.json";
import untref from "../../../data/catalog/institutions/untref.json";
import udesa from "../../../data/catalog/institutions/udesa.json";
import ub from "../../../data/catalog/institutions/ub.json";
import up from "../../../data/catalog/institutions/up.json";
import uade from "../../../data/catalog/institutions/uade.json";
import utdt from "../../../data/catalog/institutions/utdt.json";
import itba from "../../../data/catalog/institutions/itba.json";
import { careerKey, classifyFields, displayCareerName, inferLevel, normalize, sentenceCase, type ProgramLevel } from "./classify";

export const CATALOG_VERSION = "2026-11-10";

type Zone = "caba" | "gba_norte" | "gba_oeste" | "gba_sur" | "otra";

type RawInstitution = {
  id: string;
  name: string;
  shortName: string;
  sector: string;
  kind: string;
  website: string;
  status: string;
  verifiedAt: string;
  notes: string[];
  campuses: { name: string; address: string; zone: string; role: string; source: string }[];
  units: { name: string; kind: string; source: string; programs: string[] }[];
  programDetails?: Record<
    string,
    { startNote?: string; orientations?: string[]; modality?: "presencial" | "virtual" | "mixta"; durationText?: string }
  >;
};

export type Institution = {
  id: string;
  name: string;
  shortName: string;
  sector: "publica" | "privada";
  kind: string;
  website: string;
  status: "parcial" | "pendiente" | "verificado";
  verifiedAt: string;
  notes: string[];
  campuses: { name: string; address: string; zone: Zone; role: string; source: string }[];
};

export type Program = {
  id: string;
  institutionId: string;
  officialName: string; // tal como lo publica la fuente
  displayName: string; // solo presentación
  units: { name: string; kind: string }[];
  source: string;
  verifiedAt: string;
  // editorial
  level: ProgramLevel;
  fields: string[];
  careerId: string;
  // institucional, pendiente salvo que la fuente lo indique
  orientations: string[];
  startNote?: string;
  modality?: "presencial" | "virtual" | "mixta"; // solo si la fuente lo publica
  durationText?: string; // tal como lo publica la fuente
  pending: string[];
};

export type Career = {
  id: string;
  name: string;
  fields: string[];
  levels: ProgramLevel[];
  programIds: string[];
  institutionIds: string[];
};

const PENDING_FIELDS = ["duración", "título", "sedes de dictado", "modalidad", "requisitos de ingreso", "aranceles y becas", "plan de estudios"];

const RAW = [uba, utnBa, unsam, unlam, untref, udesa, ub, up, uade, utdt, itba] as RawInstitution[];

/** Id estable de oferta: nombre oficial completo normalizado (incluye paréntesis, para no colisionar). */
function slug(s: string) {
  return normalize(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function build() {
  const institutions: Institution[] = [];
  const programs: Program[] = [];
  const careers = new Map<string, Career & { names: string[] }>();

  for (const raw of RAW) {
    institutions.push({
      ...raw,
      sector: raw.sector as Institution["sector"],
      status: raw.status as Institution["status"],
      campuses: raw.campuses.map((c) => ({ ...c, zone: c.zone as Zone })),
    });

    const byName = new Map<string, Program>();
    for (const unit of raw.units) {
      for (const officialName of unit.programs) {
        const existing = byName.get(officialName);
        if (existing) {
          existing.units.push({ name: unit.name, kind: unit.kind });
          continue;
        }
        const key = careerKey(officialName);
        const level = inferLevel(officialName);
        const details = raw.programDetails?.[officialName];
        const p: Program = {
          id: `${raw.id}:${slug(officialName)}`,
          institutionId: raw.id,
          officialName,
          displayName: sentenceCase(officialName),
          units: [{ name: unit.name, kind: unit.kind }],
          source: unit.source,
          verifiedAt: raw.verifiedAt,
          level,
          fields: classifyFields(officialName),
          careerId: (level === "profesorado" ? "prof-" : "") + key.replace(/ /g, "-"),
          orientations: details?.orientations ?? [],
          startNote: details?.startNote,
          modality: details?.modality,
          durationText: details?.durationText,
          pending: PENDING_FIELDS.filter(
            (f) => !(f === "modalidad" && details?.modality) && !(f === "duración" && details?.durationText),
          ),
        };
        byName.set(officialName, p);
        programs.push(p);
      }
    }
  }

  for (const p of programs) {
    if (p.level === "ciclo") continue; // requiere título previo: no aplica a quien termina el secundario
    const c = careers.get(p.careerId) ?? {
      id: p.careerId, name: "", fields: [], levels: [], programIds: [], institutionIds: [], names: [],
    };
    c.programIds.push(p.id);
    if (!c.institutionIds.includes(p.institutionId)) c.institutionIds.push(p.institutionId);
    for (const f of p.fields) if (!c.fields.includes(f)) c.fields.push(f);
    if (!c.levels.includes(p.level)) c.levels.push(p.level);
    c.names.push(p.officialName);
    careers.set(p.careerId, c);
  }

  const careerList: Career[] = [...careers.values()].map(({ names, ...c }) => ({
    ...c,
    name: displayCareerName(names),
  }));

  return { institutions, programs, careers: careerList };
}

export const CATALOG = build();
export const INSTITUTION_BY_ID = new Map(CATALOG.institutions.map((i) => [i.id, i]));
export const PROGRAM_BY_ID = new Map(CATALOG.programs.map((p) => [p.id, p]));
export const CAREER_BY_ID = new Map(CATALOG.careers.map((c) => [c.id, c]));

export function programsOf(careerId: string): Program[] {
  return (CAREER_BY_ID.get(careerId)?.programIds ?? []).map((id) => PROGRAM_BY_ID.get(id)!).filter(Boolean);
}
