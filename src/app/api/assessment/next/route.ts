import { NextResponse } from "next/server";
import { AssessmentStateSchema } from "@/domain/methodology/schemas";
import { nextStep } from "@/domain/methodology/engine";
import { overallCoverage, resolveItem } from "@/domain/methodology/profile";
import { DIMENSIONS } from "@/domain/methodology/dimensions";
import type { ResponseRecord } from "@/domain/methodology/types";
import { aiEnabled } from "@/server/env";
import { analyzeOpenAnswer, generateFollowUp } from "@/server/ai/engines";

/**
 * Motor sin estado: el cliente envía onboarding + respuestas y recibe el
 * próximo paso. Para visitantes no se persiste nada en el servidor.
 */
export async function POST(req: Request) {
  const parsed = AssessmentStateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_state" }, { status: 400 });

  const { onboarding } = parsed.data;
  const responses = parsed.data.responses as ResponseRecord[];
  const useAI = aiEnabled && onboarding.aceptaIA;
  let wellbeing = false;

  // Analizar la última respuesta abierta (si todavía no tiene señales).
  const last = responses.at(-1);
  if (useAI && last?.answer.kind === "text" && !last.derived) {
    const item = resolveItem(last);
    const analysis = item ? await analyzeOpenAnswer(item.prompt, last.answer.text) : null;
    if (analysis) {
      last.derived = { signals: analysis.signals, themes: analysis.themes };
      wellbeing = analysis.wellbeingFlag;
    }
  }

  const opts = { allowOpen: useAI, canGenerate: useAI };
  let { step, profile } = nextStep(responses, onboarding, opts);

  if (step.type === "generate") {
    const index = responses.filter((r) => r.generatedItem).length + 1;
    const item = await generateFollowUp(step.focus, index);
    if (item) step = { type: "item", item, reason: step.reason };
    else ({ step, profile } = nextStep(responses, onboarding, { ...opts, canGenerate: false }));
  }

  return NextResponse.json({
    responses,
    step: step.type === "item" ? { type: "item", item: step.item, reason: step.reason } : { type: "done" },
    progress: {
      overall: overallCoverage(profile),
      dimensions: DIMENSIONS.map((d) => ({ id: d.id, label: d.short, ratio: profile.coverage[d.id].ratio })),
    },
    wellbeing,
    aiActive: useAI,
  });
}
