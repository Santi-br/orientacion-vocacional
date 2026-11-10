/** Validación de todo lo que entra desde el cliente. */
import { z } from "zod";
import { DIMENSIONS, FACET_KEYS, INTEREST_FACETS, type DimensionId, type FacetKey } from "./dimensions";

const facetKey = z.enum(FACET_KEYS as [FacetKey, ...FacetKey[]]);
// partialRecord: en Zod 4, z.record con claves enum exige TODAS las claves.
const signals = z.partialRecord(facetKey, z.number().min(-2).max(2));
const dimension = z.enum(DIMENSIONS.map((d) => d.id) as [DimensionId, ...DimensionId[]]);

export const OnboardingSchema = z.object({
  edad: z.enum(["15", "16", "17", "18", "otra"]),
  anio: z.enum(["3", "4", "5", "6", "egresado", "otro"]),
  zona: z.enum(["caba", "gba_norte", "gba_oeste", "gba_sur", "otra"]),
  areasConocidas: z.array(z.enum(INTEREST_FACETS as [FacetKey, ...FacetKey[]])).max(4),
  aceptaIA: z.boolean(),
});

const AnswerSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), optionIds: z.array(z.string().max(20)).min(1).max(4) }),
  z.object({ kind: z.literal("scale"), value: z.number().int().min(-2).max(5) }),
  z.object({ kind: z.literal("text"), text: z.string().trim().min(1).max(800) }),
  z.object({ kind: z.literal("skip") }),
]);

/** Preguntas generadas por IA: viajan con el estado para poder interpretarse. */
const genBase = {
  id: z.string().regex(/^gen-\d+$/),
  version: z.literal(1),
  dimension,
  kind: z.literal("deep"),
  prompt: z.string().min(10).max(240),
  helper: z.string().max(160).optional(),
  probes: z.array(facetKey).max(3).optional(),
  generated: z.literal(true),
};
const GeneratedItemSchema = z.discriminatedUnion("format", [
  z.object({
    ...genBase,
    format: z.enum(["single", "scenario"]),
    options: z
      .array(z.object({ id: z.string().max(2), label: z.string().min(1).max(120), signals: signals.optional() }))
      .min(3)
      .max(6),
  }),
  z.object({ ...genBase, format: z.literal("likert"), signals }),
  z.object({ ...genBase, format: z.literal("open"), placeholder: z.string().max(120).optional() }),
]);

export const ResponseSchema = z.object({
  itemId: z.string().max(40),
  itemVersion: z.number().int().positive(),
  answer: AnswerSchema,
  derived: z.object({ signals, themes: z.array(z.string().max(80)).max(5) }).optional(),
  generatedItem: GeneratedItemSchema.optional(),
});

export const TraceSchema = z.object({
  task: z.string().max(40),
  model: z.string().max(60),
  promptVersion: z.string().max(20),
  ok: z.boolean(),
});

export const AssessmentStateSchema = z.object({
  onboarding: OnboardingSchema,
  responses: z.array(ResponseSchema).max(60),
  aiTrace: z.array(TraceSchema).max(80).optional(),
});

export type AssessmentState = z.infer<typeof AssessmentStateSchema>;
