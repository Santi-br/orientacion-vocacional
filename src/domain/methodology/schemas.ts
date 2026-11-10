/** Validación de todo lo que entra desde el cliente. */
import { z } from "zod";
import { FACET_KEYS, INTEREST_FACETS, type FacetKey } from "./dimensions";

const facetKey = z.enum(FACET_KEYS as [FacetKey, ...FacetKey[]]);
const signals = z.record(facetKey, z.number().min(-2).max(2));

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

const GeneratedItemSchema = z.object({
  id: z.string().regex(/^gen-\d+$/),
  version: z.literal(1),
  dimension: z.enum(["intereses", "motivaciones", "valores"]),
  kind: z.literal("deep"),
  format: z.literal("open"),
  prompt: z.string().min(10).max(240),
  generated: z.literal(true),
  probes: z.array(facetKey).max(3).optional(),
});

export const ResponseSchema = z.object({
  itemId: z.string().max(40),
  itemVersion: z.number().int().positive(),
  answer: AnswerSchema,
  derived: z.object({ signals, themes: z.array(z.string().max(40)).max(5) }).optional(),
  generatedItem: GeneratedItemSchema.optional(),
});

export const AssessmentStateSchema = z.object({
  onboarding: OnboardingSchema,
  responses: z.array(ResponseSchema).max(60),
});

export type AssessmentState = z.infer<typeof AssessmentStateSchema>;
