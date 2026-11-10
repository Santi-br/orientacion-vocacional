import "server-only";
import { z } from "zod";

/**
 * Variables de entorno del servidor. Nunca usar prefijo NEXT_PUBLIC_ para
 * claves: no deben llegar al navegador.
 */
const effort = z.enum(["none", "low", "medium", "high", "xhigh", "max"]);

const schema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  // Modelos elegidos el 10/11/2026 según developers.openai.com/api/docs/models.
  // Cambiar acá (o por variable de entorno) no toca la lógica del producto.
  OPENAI_MODEL_REASONING: z.string().min(1).default("gpt-6.1-sol"),
  OPENAI_MODEL_FAST: z.string().min(1).default("gpt-6-luna"),
  OPENAI_EFFORT_REASONING: effort.default("medium"),
  OPENAI_EFFORT_FAST: effort.default("low"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const blank = (v?: string) => (v && v.trim() ? v : undefined);

export const env = schema.parse({
  OPENAI_API_KEY: blank(process.env.OPENAI_API_KEY),
  OPENAI_MODEL_REASONING: blank(process.env.OPENAI_MODEL_REASONING),
  OPENAI_MODEL_FAST: blank(process.env.OPENAI_MODEL_FAST),
  OPENAI_EFFORT_REASONING: blank(process.env.OPENAI_EFFORT_REASONING),
  OPENAI_EFFORT_FAST: blank(process.env.OPENAI_EFFORT_FAST),
  SUPABASE_URL: blank(process.env.SUPABASE_URL),
  SUPABASE_ANON_KEY: blank(process.env.SUPABASE_ANON_KEY),
});

export const aiEnabled = Boolean(env.OPENAI_API_KEY);
export const persistenceEnabled = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
