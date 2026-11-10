import "server-only";
import { buildProfile } from "@/domain/methodology/profile";
import type { Onboarding, ResponseRecord } from "@/domain/methodology/types";
import { selectCandidates } from "@/domain/matching/match";
import { buildReport, contextLabels } from "@/domain/report/build-report";
import { digest, digestText, facetSnapshot } from "@/domain/report/digest";
import type { AITrace, Report } from "@/domain/report/types";
import type { LLM } from "./llm";
import { synthesizeProfile } from "./profile-analyzer";
import { matchCareers } from "./career-matcher";
import { writeReportTexts } from "./report-writer";

/**
 * Orquesta A → C → D para el informe. Cada paso tiene respaldo determinístico:
 * si la IA falla en un paso, el informe se completa igual y lo indica.
 */
export async function buildAIReport(
  llm: LLM,
  responses: ResponseRecord[],
  onboarding: Onboarding,
  priorTrace: AITrace[] = [],
): Promise<Report> {
  const base = buildReport(responses, onboarding);
  const trace: AITrace[] = [...priorTrace];
  const profile = buildProfile(responses, onboarding);
  const lines = digest(responses);
  const itemIds = lines.map((l) => l.itemId) as [string, ...string[]];
  if (!itemIds.length) return { ...base, engine: { mode: "reglas", note: "Sin respuestas suficientes para la IA.", trace } };

  // A · Perfil exploratorio
  const a = await synthesizeProfile(llm, { digest: digestText(lines), facets: facetSnapshot(profile), itemIds });
  trace.push(a.trace);
  const exploratory = a.data ?? base.profile;

  // C · Recomendaciones sobre candidatas del catálogo
  const c = await matchCareers(llm, {
    profile: exploratory,
    digest: lines,
    candidates: selectCandidates(profile),
    context: profile.context,
    contextLabels: contextLabels(profile),
  });
  trace.push(c.trace);

  const principal = c.data?.filter((r) => r.kind === "principal") ?? base.principal;
  const discovery = c.data?.filter((r) => r.kind === "descubrimiento") ?? base.discovery;

  // D · Textos del informe
  const d = await writeReportTexts(llm, { profile: exploratory, principal, discovery });
  trace.push(d.trace);

  const allOk = a.data && c.data;
  return {
    ...base,
    profile: exploratory,
    principal,
    discovery,
    narrative: d.data?.narrative,
    closing: d.data?.closing,
    engine: {
      mode: c.data ? "ia" : "reglas",
      note: allOk ? undefined : "Parte del análisis con IA no estuvo disponible; se completó con reglas.",
      trace,
    },
  };
}
