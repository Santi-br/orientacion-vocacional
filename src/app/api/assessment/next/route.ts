import { NextResponse } from "next/server";
import { AssessmentStateSchema } from "@/domain/methodology/schemas";
import { nextStep } from "@/domain/methodology/engine";
import { buildProfile, overallCoverage, resolveItem } from "@/domain/methodology/profile";
import { DIMENSIONS } from "@/domain/methodology/dimensions";
import type { Item, ResponseRecord } from "@/domain/methodology/types";
import { digest, facetSnapshot } from "@/domain/report/digest";
import type { AITrace } from "@/domain/report/types";
import { aiEnabled } from "@/server/env";
import { providerLLM } from "@/server/ai/llm";
import { analyzeOpenAnswer } from "@/server/ai/profile-analyzer";
import { planNextQuestion } from "@/server/ai/question-planner";

export const maxDuration = 45;

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
  const trace: AITrace[] = [];
  let wellbeing = false;

  // A · Analizar la última respuesta abierta (si todavía no tiene señales).
  const last = responses.at(-1);
  if (useAI && last?.answer.kind === "text" && !last.derived) {
    const item = resolveItem(last);
    if (item) {
      const res = await analyzeOpenAnswer(providerLLM, item.prompt, last.answer.text);
      trace.push(res.trace);
      if (res.data) {
        last.derived = { signals: res.data.signals, themes: res.data.themes };
        wellbeing = res.data.wellbeingFlag;
      }
    }
  }

  const opts = { allowOpen: useAI, canGenerate: useAI };
  const { step, profile } = nextStep(responses, onboarding, opts);

  // B · Punto de control: la IA elige o formula la próxima pregunta.
  let out: { type: "item"; item: Item; reason: string } | { type: "done" };
  if (step.type === "plan") {
    const res = await planNextQuestion(providerLLM, {
      candidates: step.candidates.slice(0, 10),
      focus: step.focus,
      gaps: step.gaps,
      recent: digest(responses).slice(-6),
      askedPrompts: responses.map((r) => resolveItem(r)?.prompt ?? "").filter(Boolean).slice(-12),
      facets: facetSnapshot(buildProfile(responses, onboarding)),
      generatedCount: responses.filter((r) => r.generatedItem).length,
      nextGenIndex: responses.filter((r) => r.itemId.startsWith("gen-")).length + 1,
      allowOpen: opts.allowOpen,
    });
    trace.push(res.trace);
    out = res.data
      ? { type: "item", item: res.data.item, reason: res.data.reason }
      : { type: "item", item: step.fallback.item, reason: step.fallback.reason };
  } else if (step.type === "item") {
    out = { type: "item", item: step.item, reason: step.reason };
  } else {
    out = { type: "done" };
  }

  return NextResponse.json({
    responses,
    step: out,
    progress: {
      overall: overallCoverage(profile),
      dimensions: DIMENSIONS.map((d) => ({ id: d.id, label: d.short, ratio: profile.coverage[d.id].ratio })),
    },
    wellbeing,
    aiActive: useAI,
    trace,
  });
}
