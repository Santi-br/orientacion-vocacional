import "server-only";
import { z } from "zod";

/**
 * Variables de entorno del servidor. Nunca usar prefijo NEXT_PUBLIC_ para
 * claves: no deben llegar al navegador.
 */
const schema = z.object({
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

export const env = schema.parse({
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
  OPENAI_MODEL: process.env.OPENAI_MODEL || undefined,
  SUPABASE_URL: process.env.SUPABASE_URL || undefined,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || undefined,
});

export const aiEnabled = Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL);
export const persistenceEnabled = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
