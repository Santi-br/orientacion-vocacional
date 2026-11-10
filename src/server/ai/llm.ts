import "server-only";
import OpenAI from "openai";
import type { z } from "zod";
import { aiEnabled, env } from "../env";

/**
 * Capa delgada sobre el proveedor de IA. Todo lo que devuelve el modelo se
 * valida con Zod; si falla, el llamador recibe `null` y usa su fallback.
 * Cambiar de proveedor implica reemplazar solo este archivo.
 */
let client: OpenAI | null = null;

export async function completeJSON<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
  opts: { maxTokens?: number; timeoutMs?: number } = {},
): Promise<T | null> {
  if (!aiEnabled) return null;
  client ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  try {
    const res = await client.chat.completions.create(
      {
        model: env.OPENAI_MODEL!,
        response_format: { type: "json_object" },
        max_completion_tokens: opts.maxTokens ?? 600,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      },
      { timeout: opts.timeoutMs ?? 15000 },
    );
    const raw = res.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch (err) {
    console.error("[ai] request failed", err instanceof Error ? err.message : err);
    return null;
  }
}
