import "server-only";
import { z } from "zod";

/**
 * Variables de entorno del servidor. Nunca usar prefijo NEXT_PUBLIC_ para
 * claves: no deben llegar al navegador.
 *
 * Proveedor de IA por defecto: Groq, plan GRATIS. Decisión del
 * 10/11/2026: costo cero. Ver docs/AI_ARCHITECTURE.md.
 */
const effort = z.enum(["low", "medium", "high"]);

const PRESETS = {
  // Cada modelo tiene su propia cuota gratuita: repartir las tareas multiplica las evaluaciones por día.
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    reasoning: "openai/gpt-oss-120b", // perfil + recomendaciones
    fast: "openai/gpt-oss-20b", // respuestas abiertas + textos del informe
    planner: "qwen/qwen3.8-27b", // preguntas adaptativas
  },
  openai: { baseURL: undefined, reasoning: "gpt-6.1-sol", fast: "gpt-6-luna", planner: "gpt-6-luna" },
} as const;

const schema = z.object({
  AI_PROVIDER: z.enum(["groq", "openai"]).default("groq"),
  AI_API_KEY: z.string().min(1).optional(),
  AI_MODEL_REASONING: z.string().min(1).optional(),
  AI_MODEL_FAST: z.string().min(1).optional(),
  AI_MODEL_PLANNER: z.string().min(1).optional(),
  AI_EFFORT_REASONING: effort.default("medium"),
  AI_EFFORT_FAST: effort.default("low"),
  AI_BASE_URL: z.string().url().optional(), // para pruebas o un endpoint compatible
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const blank = (v?: string) => (v && v.trim() ? v : undefined);

const raw = schema.parse({
  AI_PROVIDER: blank(process.env.AI_PROVIDER),
  AI_API_KEY: blank(process.env.AI_API_KEY),
  AI_MODEL_REASONING: blank(process.env.AI_MODEL_REASONING),
  AI_MODEL_FAST: blank(process.env.AI_MODEL_FAST),
  AI_MODEL_PLANNER: blank(process.env.AI_MODEL_PLANNER),
  AI_EFFORT_REASONING: blank(process.env.AI_EFFORT_REASONING),
  AI_EFFORT_FAST: blank(process.env.AI_EFFORT_FAST),
  AI_BASE_URL: blank(process.env.AI_BASE_URL),
  SUPABASE_URL: blank(process.env.SUPABASE_URL),
  SUPABASE_ANON_KEY: blank(process.env.SUPABASE_ANON_KEY),
});

const preset = PRESETS[raw.AI_PROVIDER];

export const env = {
  ...raw,
  AI_BASE_URL: raw.AI_BASE_URL ?? preset.baseURL,
  AI_MODEL_REASONING: raw.AI_MODEL_REASONING ?? preset.reasoning,
  AI_MODEL_FAST: raw.AI_MODEL_FAST ?? preset.fast,
  AI_MODEL_PLANNER: raw.AI_MODEL_PLANNER ?? preset.planner,
};

export const aiEnabled = Boolean(env.AI_API_KEY);
export const persistenceEnabled = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);
