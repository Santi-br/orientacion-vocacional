import "server-only";
import { METHODOLOGY_VERSION, FACETS } from "@/domain/methodology/dimensions";
import { buildProfile } from "@/domain/methodology/profile";
import type { AssessmentState } from "@/domain/methodology/schemas";
import type { ResponseRecord } from "@/domain/methodology/types";
import type { Report } from "@/domain/report/build-report";
import { getSupabase } from "../supabase";

/** Días que se conserva una evaluación guardada si la cuenta queda inactiva (a definir con asesoría legal). */
export const RETENTION_DAYS = 365;

/**
 * Persiste una evaluación finalizada para un usuario autenticado.
 * Solo se llama cuando la persona crea cuenta y elige guardar (Etapa 2).
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

  const matches = [...report.principal, ...report.discovery];
  for (const [rank, m] of matches.entries()) {
    const { data: rec } = await sb
      .from("recommendations")
      .insert({
        assessment_id: a.id, field_id: m.field.id, kind: m.kind, level: m.level,
        personal: m.personal, academic: m.academic, rank,
      })
      .select("id")
      .single();
    if (!rec) continue;
    await sb.from("recommendation_reasons").insert([
      ...m.reasons.map((r) => ({ recommendation_id: rec.id, type: "razon", facet: r.facet, text: r.label })),
      ...m.supports.map((s) => ({ recommendation_id: rec.id, type: "respaldo", text: s.answer, response_question_id: s.itemId })),
      ...m.misfits.map((r) => ({ recommendation_id: rec.id, type: "no_encaja", facet: r.facet, text: r.label })),
      ...m.unexplored.map((t) => ({ recommendation_id: rec.id, type: "falta_explorar", text: t })),
      ...m.related.map((t) => ({ recommendation_id: rec.id, type: "relacionada", text: t })),
    ]);
  }
  return a.id as string;
}
