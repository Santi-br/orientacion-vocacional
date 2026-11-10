import "server-only";
import { z } from "zod";
import { FACET_KEYS, isFacetKey, type FacetKey } from "@/domain/methodology/dimensions";
import type { Signals } from "@/domain/methodology/types";
import type { ExploratoryProfile } from "@/domain/report/types";
import type { LLM, LLMResult } from "./llm";
import { PROMPTS } from "./prompts";

/* ── A.1 · Respuesta abierta → señales (modelo rápido) ── */

const facetEnum = z.enum(FACET_KEYS as [FacetKey, ...FacetKey[]]);

const OpenSchema = z.object({
  signals: z.array(z.object({ facet: facetEnum, weight: z.number() })),
  themes: z.array(z.string()),
  hobby_hint: z.string().nullable(),
  wellbeing_flag: z.boolean(),
});

export type OpenAnalysis = { signals: Signals; themes: string[]; wellbeingFlag: boolean };

export async function analyzeOpenAnswer(
  llm: LLM,
  prompt: string,
  text: string,
): Promise<LLMResult<OpenAnalysis>> {
  const res = await llm.run(
    PROMPTS.openAnswer,
    `Pregunta: ${prompt}\n<respuesta_estudiante>\n${text}\n</respuesta_estudiante>`,
    OpenSchema,
    { timeoutMs: 20_000 },
  );
  if (!res.data) return { data: null, trace: res.trace };
  const signals: Signals = {};
  for (const s of res.data.signals.slice(0, 5)) {
    if (isFacetKey(s.facet)) signals[s.facet] = clamp(s.weight, -1.5, 1.5);
  }
  const themes = res.data.themes.map((t) => t.trim().slice(0, 40)).filter(Boolean).slice(0, 4);
  if (res.data.hobby_hint) themes.push(`como pasatiempo: ${res.data.hobby_hint.slice(0, 30)}`);
  return { data: { signals, themes, wellbeingFlag: res.data.wellbeing_flag }, trace: res.trace };
}

/* ── A.2 · Perfil exploratorio completo (modelo de razonamiento) ── */

export function profileSchema(itemIds: [string, ...string[]]) {
  const ids = z.array(z.enum(itemIds));
  const theme = z.object({ label: z.string(), detail: z.string(), evidence_item_ids: ids });
  return z.object({
    summary: z.string(),
    primary: z.array(theme),
    secondary: z.array(theme),
    combinations: z.array(theme),
    hobbies: z.array(theme),
    tensions: z.array(theme),
    unexplored: z.array(z.string()),
  });
}

export async function synthesizeProfile(
  llm: LLM,
  input: { digest: string; facets: string; itemIds: [string, ...string[]] },
): Promise<LLMResult<ExploratoryProfile>> {
  const res = await llm.run(
    PROMPTS.profile,
    `<respuestas>\n${input.digest}\n</respuestas>\n\nSeñales calculadas por reglas (orientativas):\n${input.facets}`,
    profileSchema(input.itemIds),
  );
  if (!res.data) return { data: null, trace: res.trace };
  const t = (xs: { label: string; detail: string }[], n: number) =>
    xs.slice(0, n).map(({ label, detail }) => ({ label: label.slice(0, 80), detail: detail.slice(0, 300) }));
  const d = res.data;
  return {
    data: {
      summary: d.summary.slice(0, 600),
      primary: t(d.primary, 3),
      secondary: t(d.secondary, 4),
      combinations: t(d.combinations, 3),
      hobbies: t(d.hobbies, 3),
      tensions: t(d.tensions, 3),
      unexplored: d.unexplored.slice(0, 4).map((u) => u.slice(0, 200)),
    },
    trace: res.trace,
  };
}

function clamp(x: number, a: number, b: number) {
  return Math.max(a, Math.min(b, x));
}
