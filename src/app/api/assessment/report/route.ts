import { NextResponse } from "next/server";
import { AssessmentStateSchema } from "@/domain/methodology/schemas";
import { buildReport } from "@/domain/report/build-report";
import type { ResponseRecord } from "@/domain/methodology/types";
import { aiEnabled } from "@/server/env";
import { openaiLLM } from "@/server/ai/llm";
import { buildAIReport } from "@/server/ai/pipeline";

export const maxDuration = 150;

export async function POST(req: Request) {
  const parsed = AssessmentStateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_state" }, { status: 400 });

  const { onboarding, aiTrace = [] } = parsed.data;
  const responses = parsed.data.responses as ResponseRecord[];

  if (aiEnabled && onboarding.aceptaIA) {
    return NextResponse.json(await buildAIReport(openaiLLM, responses, onboarding, aiTrace));
  }
  const report = buildReport(responses, onboarding);
  report.engine.note = onboarding.aceptaIA
    ? "El análisis con IA no está configurado en este entorno; el informe se armó con reglas."
    : "Elegiste no usar IA; el informe se armó con reglas.";
  return NextResponse.json(report);
}
