import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import type { AITrace } from "@/domain/report/types";
import { aiEnabled, env } from "../env";
import type { Prompt } from "./prompts";

/**
 * Única puerta al proveedor de IA.
 *
 * Por defecto usa Groq (plan gratis) a través de su API compatible con OpenAI:
 * Chat Completions + `response_format: json_schema` en modo estricto. El mismo
 * código sirve para OpenAI u otro proveedor compatible cambiando variables de
 * entorno (ver env.ts). La lógica del producto no conoce el proveedor.
 *
 * - Toda salida se valida con Zod.
 * - Cada llamada devuelve una traza (tarea, modelo, versión de prompt).
 * - Si se alcanza el límite gratuito (HTTP 429) se reintenta una vez; si
 *   vuelve a fallar, devuelve data = null y el llamador usa su respaldo.
 */
export type Tier = "reasoning" | "fast" | "planner";

export type LLMResult<T> = { data: T | null; trace: AITrace };

export interface LLM {
  run<T>(prompt: Prompt, input: string, schema: z.ZodType<T>, opts?: { timeoutMs?: number }): Promise<LLMResult<T>>;
}

let client: OpenAI | null = null;

function modelFor(tier: Tier) {
  if (tier === "reasoning") return { model: env.AI_MODEL_REASONING, effort: env.AI_EFFORT_REASONING };
  if (tier === "planner") return { model: env.AI_MODEL_PLANNER, effort: env.AI_EFFORT_FAST };
  return { model: env.AI_MODEL_FAST, effort: env.AI_EFFORT_FAST };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const providerLLM: LLM = {
  async run<T>(prompt: Prompt, input: string, schema: z.ZodType<T>, opts: { timeoutMs?: number } = {}): Promise<LLMResult<T>> {
    const { model, effort } = modelFor(prompt.tier);
    const trace: AITrace = { task: prompt.id, model, promptVersion: prompt.version, ok: false };
    if (!aiEnabled) return { data: null, trace };
    client ??= new OpenAI({ apiKey: env.AI_API_KEY, baseURL: env.AI_BASE_URL, maxRetries: 0 });

    // El helper genera un JSON Schema estricto (sin propiedades extra, todo requerido).
    const format = zodTextFormat(schema, prompt.id.replace(/[^a-z_]/gi, "_"));

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await client.chat.completions.create(
          {
            model,
            reasoning_effort: effort,
            messages: [
              { role: "system", content: prompt.system },
              { role: "user", content: input },
            ],
            response_format: {
              type: "json_schema",
              json_schema: { name: format.name, schema: format.schema, strict: true },
            },
            // Groq: no incluir el razonamiento en la respuesta (menos tokens).
            ...(env.AI_PROVIDER === "groq" ? { include_reasoning: false } : {}),
          } as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
          { timeout: opts.timeoutMs ?? 45_000 },
        );
        const raw = res.choices[0]?.message?.content;
        if (!raw) return { data: null, trace };
        const parsed = schema.safeParse(JSON.parse(raw));
        if (!parsed.success) return { data: null, trace };
        return { data: parsed.data, trace: { ...trace, ok: true } };
      } catch (err) {
        const apiErr = err instanceof OpenAI.APIError ? err : null;
        const status = apiErr?.status;
        if (status === 429 && attempt === 0) {
          // Límite por minuto del plan gratuito: esperar lo que indique el proveedor (máx. 20 s) y reintentar una vez.
          const retryAfter = Number(apiErr?.headers?.get?.("retry-after")) || 5;
          await sleep(Math.min(retryAfter, 20) * 1000);
          continue;
        }
        console.error(`[ai] ${prompt.id} failed:`, status ?? "", err instanceof Error ? err.message : err);
        return { data: null, trace };
      }
    }
    return { data: null, trace };
  },
};
