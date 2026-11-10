import "server-only";
import { z } from "zod";
import { DIMENSIONS, FACET_KEYS, FACETS, isFacetKey, type DimensionId, type FacetKey } from "@/domain/methodology/dimensions";
import type { Candidate } from "@/domain/methodology/engine";
import type { Item, Signals } from "@/domain/methodology/types";
import type { DigestLine } from "@/domain/report/digest";
import type { LLM, LLMResult } from "./llm";
import { PROMPTS } from "./prompts";

/**
 * B · ADAPTIVE QUESTION ENGINE (IA). En cada punto de control decide si
 * conviene una pregunta del banco o formular una nueva. Lo que devuelve se
 * valida y se convierte en un Item normal; si no es válido, se usa el respaldo.
 */
const facetEnum = z.enum(FACET_KEYS as [FacetKey, ...FacetKey[]]);
const signalList = z.array(z.object({ facet: facetEnum, weight: z.number() }));
const DIMS = DIMENSIONS.map((d) => d.id).filter((d) => d !== "contexto") as [DimensionId, ...DimensionId[]];

export function plannerSchema(bankIds: [string, ...string[]]) {
  return z.object({
    action: z.enum(["bank", "generate"]),
    item_id: z.enum(bankIds).nullable(),
    question: z
      .object({
        format: z.enum(["single", "scenario", "likert", "open"]),
        dimension: z.enum(DIMS),
        prompt: z.string(),
        helper: z.string().nullable(),
        options: z.array(z.object({ label: z.string(), signals: signalList })),
        statement_signals: signalList,
        probes: z.array(facetEnum),
      })
      .nullable(),
    rationale: z.string(),
  });
}

type PlannerOut = z.infer<ReturnType<typeof plannerSchema>>;

export type PlanInput = {
  candidates: Candidate[];
  focus: FacetKey[];
  gaps: DimensionId[];
  recent: DigestLine[];
  askedPrompts: string[];
  facets: string;
  generatedCount: number;
  nextGenIndex: number;
  allowOpen: boolean;
};

export async function planNextQuestion(llm: LLM, input: PlanInput): Promise<LLMResult<{ item: Item; reason: string }>> {
  const bankIds = input.candidates.map((c) => c.item.id) as [string, ...string[]];
  const res = await llm.run(
    PROMPTS.planner,
    [
      `Faltan dimensiones: ${input.gaps.join(", ") || "ninguna"}`,
      `Intereses más marcados: ${input.focus.map((k) => FACETS[k].label).join(", ") || "todavía no claros"}`,
      `Preguntas generadas hasta ahora: ${input.generatedCount}`,
      input.allowOpen ? "" : "No generes preguntas abiertas (la persona no habilitó el análisis de texto).",
      `\nSeñales actuales:\n${input.facets}`,
      `\n<respuestas>\nÚltimas respuestas:\n${input.recent.map((l) => `- ${l.prompt} → ${l.answer}`).join("\n")}\n</respuestas>`,
      `\nYa preguntado (no repetir):\n${input.askedPrompts.map((p) => `- ${p}`).join("\n")}`,
      `\nBanco disponible (id · dimensión · motivo sugerido · pregunta):\n${input.candidates
        .map((c) => `${c.item.id} · ${c.item.dimension} · ${c.reason} · ${c.item.prompt}`)
        .join("\n")}`,
    ].join("\n"),
    plannerSchema(bankIds),
    { timeoutMs: 15_000 },
  );
  if (!res.data) return { data: null, trace: res.trace };
  const item = toItem(res.data, input);
  if (!item) return { data: null, trace: { ...res.trace, ok: false } };
  return { data: { item, reason: res.data.rationale.slice(0, 200) }, trace: res.trace };
}

function clampSignals(list: { facet: string; weight: number }[], max = 4): Signals {
  const out: Signals = {};
  for (const s of list.slice(0, max)) {
    if (isFacetKey(s.facet)) out[s.facet] = Math.max(-1.5, Math.min(1.5, s.weight));
  }
  return out;
}

const clean = (s: string, n: number) => s.replace(/\s+/g, " ").trim().slice(0, n);

/** Exportada para tests: valida la decisión de la IA y la convierte en un Item. */
export function toItem(out: PlannerOut, input: Pick<PlanInput, "candidates" | "nextGenIndex" | "allowOpen">): Item | null {
  if (out.action === "bank") {
    return input.candidates.find((c) => c.item.id === out.item_id)?.item ?? null;
  }
  const q = out.question;
  if (!q || q.prompt.trim().length < 10) return null;
  if (q.format === "open" && !input.allowOpen) return null;
  const base = {
    id: `gen-${input.nextGenIndex}`,
    version: 1,
    dimension: q.dimension,
    kind: "deep" as const,
    prompt: clean(q.prompt, 240),
    helper: q.helper ? clean(q.helper, 160) : undefined,
    probes: q.probes.filter(isFacetKey).slice(0, 3),
    generated: true,
  };
  switch (q.format) {
    case "single":
    case "scenario": {
      const options = q.options.slice(0, 6).map((o, i) => ({
        id: String.fromCharCode(97 + i),
        label: clean(o.label, 120),
        signals: clampSignals(o.signals),
      }));
      if (options.length < 3 || options.some((o) => !o.label)) return null;
      return { ...base, format: q.format, options };
    }
    case "likert": {
      const signals = clampSignals(q.statement_signals);
      if (!Object.keys(signals).length) return null;
      return { ...base, format: "likert", signals };
    }
    case "open":
      return { ...base, format: "open" };
  }
}
