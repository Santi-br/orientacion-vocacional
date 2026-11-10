import "server-only";
import { z } from "zod";
import type { Report } from "@/domain/report/types";
import type { LLM, LLMResult } from "./llm";
import { PROMPTS } from "./prompts";

/** D · REPORT GENERATOR (IA): solo redacta a partir del informe estructurado. */
const Schema = z.object({ narrative: z.string(), closing: z.string() });

export async function writeReportTexts(
  llm: LLM,
  report: Pick<Report, "profile" | "principal" | "discovery">,
): Promise<LLMResult<{ narrative: string; closing: string }>> {
  const facts = {
    perfil: report.profile,
    carreras: [...report.principal, ...report.discovery].map((r) => ({
      carrera: r.name,
      tipo: r.kind,
      por_que: r.why,
    })),
  };
  const res = await llm.run(PROMPTS.report, JSON.stringify(facts), Schema, { timeoutMs: 30_000 });
  if (!res.data) return res;
  return {
    data: { narrative: res.data.narrative.slice(0, 1200), closing: res.data.closing.slice(0, 400) },
    trace: res.trace,
  };
}
