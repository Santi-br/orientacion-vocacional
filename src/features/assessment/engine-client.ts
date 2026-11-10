"use client";
/**
 * Puente entre la interfaz y el motor.
 *
 * - Con servidor (Vercel / `npm run dev`): llama a /api/assessment/* (y ahí puede usar IA).
 * - En la versión estática (GitHub Pages, NEXT_PUBLIC_STATIC_EXPORT=1): no hay
 *   servidor, así que corre el mismo motor de reglas en el navegador. Nada sale
 *   del dispositivo.
 */
import { DIMENSIONS } from "@/domain/methodology/dimensions";
import { nextStep } from "@/domain/methodology/engine";
import { overallCoverage } from "@/domain/methodology/profile";
import type { Item, Onboarding, ResponseRecord } from "@/domain/methodology/types";
import { buildReport } from "@/domain/report/build-report";
import type { AITrace, Report } from "@/domain/report/types";

export const STATIC_MODE = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

export type NextResult = {
  responses: ResponseRecord[];
  step: { type: "item"; item: Item; reason: string } | { type: "done" };
  progress: { overall: number; dimensions: { id: string; label: string; ratio: number }[] };
  wellbeing: boolean;
  trace: AITrace[];
};

type State = { onboarding: Onboarding; responses: ResponseRecord[]; aiTrace?: AITrace[] };

export async function requestNext(state: State): Promise<NextResult> {
  if (!STATIC_MODE) {
    const res = await fetch("/api/assessment/next", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ onboarding: state.onboarding, responses: state.responses }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }
  const { step, profile } = nextStep(state.responses, state.onboarding, { allowOpen: false, canGenerate: false });
  return {
    responses: state.responses,
    step: step.type === "item" ? { type: "item", item: step.item, reason: step.reason } : { type: "done" },
    progress: {
      overall: overallCoverage(profile),
      dimensions: DIMENSIONS.map((d) => ({ id: d.id, label: d.short, ratio: profile.coverage[d.id].ratio })),
    },
    wellbeing: false,
    trace: [],
  };
}

export async function requestReport(state: State): Promise<Report> {
  if (!STATIC_MODE) {
    const res = await fetch("/api/assessment/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ onboarding: state.onboarding, responses: state.responses, aiTrace: state.aiTrace ?? [] }),
    });
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  }
  const report = buildReport(state.responses, state.onboarding);
  report.engine.note = "Versión de demostración: el informe se armó con reglas, sin IA, y nada salió de tu dispositivo.";
  return report;
}
