import { NextResponse } from "next/server";
import { AssessmentStateSchema } from "@/domain/methodology/schemas";
import { buildReport } from "@/domain/report/build-report";
import type { ResponseRecord } from "@/domain/methodology/types";
import { aiEnabled } from "@/server/env";
import { writeNarrative } from "@/server/ai/engines";

export async function POST(req: Request) {
  const parsed = AssessmentStateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_state" }, { status: 400 });

  const { onboarding } = parsed.data;
  const report = buildReport(parsed.data.responses as ResponseRecord[], onboarding);

  // La IA solo recibe el perfil estructurado (no el texto libre) y solo con consentimiento.
  if (aiEnabled && onboarding.aceptaIA) {
    report.narrative = (await writeNarrative(report)) ?? undefined;
  }
  return NextResponse.json(report);
}
