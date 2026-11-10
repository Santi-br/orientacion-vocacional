import "server-only";
import { METHODOLOGY_VERSION, FACETS } from "@/domain/methodology/dimensions";
import { buildProfile } from "@/domain/methodology/profile";
import type { AssessmentState } from "@/domain/methodology/schemas";
import type { ResponseRecord } from "@/domain/methodology/types";
import type { Report } from "@/domain/report/types";
import { getSupabase } from "../supabase";

/** Días que se conserva una evaluación guardada (a confirmar en la revisión legal previa al lanzamiento). */
export const RETENTION_DAYS = 365;

/**
 * Persiste una evaluación finalizada para un usuario autenticado.
 * Solo se llama cuando la persona crea cuenta y elige guardar (hito 8).
 * RLS garantiza que solo pueda escribir sus propias filas.
 */
export async function saveFinishedAssessment(state: AssessmentState, report: Report) {
  const sb = await getSupabase();
  if (!sb) throw new Error("persistence_disabled");
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("unauthenticated");

  const responses = state.responses as ResponseRecord[];
  const profile = buildProfile(responses, state.onboarding);
  const expires = new Date(Date.now() + RETENTION_DAYS * 864e5).toISOString();

  const { data: a, error } = await sb
    .from("assessments")
    .insert({
      user_id: auth.user.id,
      methodology_version: METHODOLOGY_VERSION,
      catalog_version: report.catalogVersion,
      engine: report.engine, // modo, modelos y versiones de prompt usados
      status: "finalizada",
      onboarding: state.onboarding,
      ai_consent: state.onboarding.aceptaIA,
      finished_at: new Date().toISOString(),
      expires_at: expires,
    })
    .select("id")
    .single();
  if (error || !a) throw error ?? new Error("insert_failed");

  await sb.from("responses").insert(
    responses.map((r, i) => ({
      assessment_id: a.id,
      position: i,
      question_id: r.itemId,
      question_version: r.itemVersion,
      generated_definition: r.generatedItem ?? null,
      answer: r.answer,
      derived: r.derived ?? null,
    })),
  );

  await sb.from("profiles").insert({
    assessment_id: a.id,
    coverage: profile.coverage,
    context: profile.context,
    tensions: profile.tensions,
    exploratory: report.profile,
  });
  await sb.from("profile_dimensions").insert(
    Object.values(profile.facets).map((f) => ({
      assessment_id: a.id,
      facet: f.key,
      dimension: FACETS[f.key].dimension,
      score: f.score,
      confidence: f.confidence,
      evidence: f.evidence,
    })),
  );

  for (const [rank, m] of [...report.principal, ...report.discovery].entries()) {
    const { data: rec } = await sb
      .from("recommendations")
      .insert({ assessment_id: a.id, career_key: m.careerId, kind: m.kind, level: m.level, rank, why: m.why })
      .select("id")
      .single();
    if (!rec) continue;
    await sb.from("recommendation_reasons").insert([
      ...m.matchingInterests.map((t) => ({ recommendation_id: rec.id, type: "razon", text: t })),
      ...m.evidence.map((e) => ({ recommendation_id: rec.id, type: "respaldo", text: e.note, response_question_id: e.itemId })),
      ...m.activities.map((t) => ({ recommendation_id: rec.id, type: "actividad", text: t })),
      ...m.misfits.map((t) => ({ recommendation_id: rec.id, type: "no_encaja", text: t })),
      ...m.unknowns.map((t) => ({ recommendation_id: rec.id, type: "falta_explorar", text: t })),
      ...m.related.map((x) => ({ recommendation_id: rec.id, type: "relacionada", text: x.careerId })),
    ]);
  }
  return a.id as string;
}
