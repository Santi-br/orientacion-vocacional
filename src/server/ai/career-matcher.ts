import "server-only";
import { z } from "zod";
import { CAREER_BY_ID, INSTITUTION_BY_ID } from "@/domain/catalog/catalog";
import { STUDY_FIELDS } from "@/domain/catalog/study-fields";
import { institutionsFor, PENDING_DATA, type ScoredCareer } from "@/domain/matching/match";
import type { Context } from "@/domain/methodology/types";
import type { DigestLine } from "@/domain/report/digest";
import type { ExploratoryProfile, Recommendation } from "@/domain/report/types";
import type { LLM, LLMResult } from "./llm";
import { PROMPTS } from "./prompts";

/**
 * C · CAREER MATCHING ENGINE (IA). La IA razona sobre el perfil y elige entre
 * carreras CANDIDATAS del catálogo verificado. Los IDs son un enum en el
 * esquema: no puede devolver una carrera que no exista. Los datos de cada
 * institución se agregan después, desde el catálogo, nunca desde la IA.
 */
const FIELD_NAME = new Map(STUDY_FIELDS.map((f) => [f.id, f.name]));

export function matcherSchema(careerIds: [string, ...string[]], itemIds: [string, ...string[]]) {
  return z.object({
    recommendations: z.array(
      z.object({
        career_id: z.enum(careerIds),
        kind: z.enum(["principal", "descubrimiento"]),
        level: z.enum(["muy_marcada", "clara", "posible", "exploratoria"]),
        why: z.string(),
        evidence: z.array(z.object({ item_id: z.enum(itemIds), note: z.string() })),
        matching_interests: z.array(z.string()),
        activities: z.array(z.string()),
        misfits: z.array(z.string()),
        unknowns: z.array(z.string()),
        related_career_ids: z.array(z.enum(careerIds)),
      }),
    ),
  });
}

type MatcherOut = z.infer<ReturnType<typeof matcherSchema>>;

export type MatchInput = {
  profile: ExploratoryProfile;
  digest: DigestLine[];
  candidates: ScoredCareer[];
  context: Partial<Context>;
  contextLabels: Record<string, string>;
};

function candidateLine(s: ScoredCareer) {
  const insts = s.career.institutionIds.map((id) => INSTITUTION_BY_ID.get(id)?.shortName).join(", ");
  const fields = s.career.fields.map((f) => FIELD_NAME.get(f)).join(" / ");
  return `${s.career.id} · ${s.career.name} · áreas: ${fields} · se ofrece en: ${insts} · puntaje de referencia: ${s.score.toFixed(2)}`;
}

export async function matchCareers(llm: LLM, input: MatchInput): Promise<LLMResult<Recommendation[]>> {
  const careerIds = input.candidates.map((c) => c.career.id) as [string, ...string[]];
  const itemIds = input.digest.map((d) => d.itemId) as [string, ...string[]];
  if (!careerIds.length || !itemIds.length) {
    return { data: null, trace: { task: PROMPTS.matcher.id, model: "-", promptVersion: PROMPTS.matcher.version, ok: false } };
  }
  const p = input.profile;
  const res = await llm.run(
    PROMPTS.matcher,
    [
      `PERFIL EXPLORATORIO\n${p.summary}`,
      `Principales: ${p.primary.map((t) => `${t.label} (${t.detail})`).join("; ")}`,
      `Secundarios: ${p.secondary.map((t) => t.label).join("; ")}`,
      `Combinaciones: ${p.combinations.map((t) => `${t.label}: ${t.detail}`).join("; ") || "—"}`,
      `Pasatiempos (no necesariamente vocacionales): ${p.hobbies.map((t) => t.label).join("; ") || "—"}`,
      `Tensiones: ${p.tensions.map((t) => `${t.label}: ${t.detail}`).join("; ") || "—"}`,
      `Contexto (no descartar por esto): ${Object.values(input.contextLabels).join("; ") || "—"}`,
      `\n<respuestas>\n${input.digest.map((l) => `[${l.itemId}] ${l.prompt} → ${l.answer}`).join("\n")}\n</respuestas>`,
      `\nCARRERAS CANDIDATAS (catálogo verificado; usá solo estos IDs):\n${input.candidates.map(candidateLine).join("\n")}`,
    ].join("\n"),
    matcherSchema(careerIds, itemIds),
    { timeoutMs: 90_000 },
  );
  if (!res.data) return { data: null, trace: res.trace };
  const recs = toRecommendations(res.data, input);
  const principal = recs.filter((r) => r.kind === "principal");
  if (principal.length < 3) return { data: null, trace: { ...res.trace, ok: false } };
  return { data: recs, trace: res.trace };
}

const s = (x: string, n: number) => x.replace(/\s+/g, " ").trim().slice(0, n);

/** Exportada para tests: valida, deduplica y completa con datos del catálogo. */
export function toRecommendations(out: MatcherOut, input: Pick<MatchInput, "digest" | "context">): Recommendation[] {
  const seen = new Set<string>();
  const byItem = new Map(input.digest.map((d) => [d.itemId, d]));
  const recs: Recommendation[] = [];
  for (const r of out.recommendations) {
    const career = CAREER_BY_ID.get(r.career_id);
    if (!career || seen.has(career.id)) continue;
    seen.add(career.id);
    const principalCount = recs.filter((x) => x.kind === "principal").length;
    const discoveryCount = recs.length - principalCount;
    if (r.kind === "principal" ? principalCount >= 6 : discoveryCount >= 3) continue;
    recs.push({
      careerId: career.id,
      name: career.name,
      kind: r.kind,
      level: r.level,
      why: s(r.why, 600),
      evidence: r.evidence
        .filter((e) => byItem.has(e.item_id))
        .slice(0, 4)
        .map((e) => {
          const d = byItem.get(e.item_id)!;
          return { itemId: e.item_id, prompt: d.prompt, answer: d.answer, note: s(e.note, 240) };
        }),
      matchingInterests: r.matching_interests.slice(0, 5).map((x) => s(x, 80)),
      activities: r.activities.slice(0, 4).map((x) => s(x, 120)),
      misfits: r.misfits.slice(0, 3).map((x) => s(x, 240)),
      unknowns: r.unknowns.slice(0, 3).map((x) => s(x, 240)),
      related: r.related_career_ids
        .filter((id) => id !== career.id)
        .slice(0, 3)
        .map((id) => ({ careerId: id, name: CAREER_BY_ID.get(id)!.name })),
      institutions: institutionsFor(career.id, input.context),
      pendingData: PENDING_DATA,
    });
  }
  return recs;
}
