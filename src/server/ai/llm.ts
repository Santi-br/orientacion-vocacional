import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import type { AITrace } from "@/domain/report/types";
import { aiEnabled, env } from "../env";
import type { Prompt } from "./prompts";

/**
 * Única puerta al proveedor de IA (OpenAI Responses API + Structured Outputs).
 * - Toda salida se valida con el esquema Zod (strict).
 * - Cada llamada devuelve una traza (tarea, modelo, versión de prompt) que se
 *   guarda con la evaluación.
 * - Si algo falla, devuelve data = null y el llamador usa su respaldo.
 * Cambiar de proveedor implica reemplazar este archivo.
 */
export type Tier = "reasoning" | "fast";

export type LLMResult<T> = { data: T | null; trace: AITrace };

export interface LLM {
  run<T>(prompt: Prompt, input: string, schema: z.ZodType<T>, opts?: { timeoutMs?: number }): Promise<LLMResult<T>>;
}

let client: OpenAI | null = null;

function modelFor(tier: Tier) {
  return tier === "reasoning"
    ? { model: env.OPENAI_MODEL_REASONING, effort: env.OPENAI_EFFORT_REASONING }
    : { model: env.OPENAI_MODEL_FAST, effort: env.OPENAI_EFFORT_FAST };
}

export const openaiLLM: LLM = {
  async run<T>(prompt: Prompt, input: string, schema: z.ZodType<T>, opts: { timeoutMs?: number } = {}): Promise<LLMResult<T>> {
    const { model, effort } = modelFor(prompt.tier);
    const trace: AITrace = { task: prompt.id, model, promptVersion: prompt.version, ok: false };
    if (!aiEnabled) return { data: null, trace };
    client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
    try {
      const res = await client.responses.parse(
        {
          model,
          reasoning: { effort },
          // No guardar las respuestas del lado del proveedor.
          store: false,
          input: [
            { role: "system", content: prompt.system },
            { role: "user", content: input },
          ],
          text: { format: zodTextFormat(schema, prompt.id.replace(/[^a-z_]/gi, "_")) },
        },
        { timeout: opts.timeoutMs ?? 45_000 },
      );
      const data = (res.output_parsed as T | null) ?? null;
      return { data, trace: { ...trace, ok: data !== null } };
    } catch (err) {
      console.error(`[ai] ${prompt.id} failed:`, err instanceof Error ? err.message : err);
      return { data: null, trace };
    }
  },
};
