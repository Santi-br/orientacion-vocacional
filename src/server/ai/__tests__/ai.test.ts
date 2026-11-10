import { describe, expect, it } from "vitest";
import type { z } from "zod";
import { nextStep } from "@/domain/methodology/engine";
import { QUESTION_BANK } from "@/domain/methodology/question-bank";
import type { Answer, Item, Onboarding, ResponseRecord } from "@/domain/methodology/types";
import { buildProfile } from "@/domain/methodology/profile";
import { selectCandidates } from "@/domain/matching/match";
import { CAREER_BY_ID } from "@/domain/catalog/catalog";
import { digest } from "@/domain/report/digest";
import type { LLM, LLMResult } from "../llm";
import type { Prompt } from "../prompts";
import { buildAIReport } from "../pipeline";
import { matcherSchema, toRecommendations } from "../career-matcher";
import { plannerSchema, toItem } from "../question-planner";

const base: Onboarding = { edad: "17", anio: "5", zona: "caba", areasConocidas: [], aceptaIA: true };

/** Recorrido de prueba: elige siempre la primera opción / valor alto. */
function walk(n = 24): ResponseRecord[] {
  const out: ResponseRecord[] = [];
  for (let i = 0; i < n; i++) {
    const { step } = nextStep(out, base, { allowOpen: false, canGenerate: false });
    if (step.type !== "item") break;
    const it: Item = step.item;
    const answer: Answer =
      "options" in it ? { kind: "choice", optionIds: [it.options[0].id] }
      : it.format === "likert" ? { kind: "scale", value: 5 }
      : it.format === "bipolar" ? { kind: "scale", value: -2 }
      : { kind: "skip" };
    out.push({ itemId: it.id, itemVersion: 1, answer });
  }
  return out;
}

/** LLM falso: responde según la tarea con lo que el test le indique. */
function fakeLLM(handlers: Record<string, (schema: z.ZodType<unknown>) => unknown>): LLM {
  return {
    async run<T>(prompt: Prompt, _input: string, schema: z.ZodType<T>): Promise<LLMResult<T>> {
      const h = handlers[prompt.id];
      const trace = { task: prompt.id, model: "fake", promptVersion: prompt.version, ok: false };
      if (!h) return { data: null, trace };
      const parsed = schema.safeParse(h(schema as z.ZodType<unknown>));
      return parsed.success ? { data: parsed.data, trace: { ...trace, ok: true } } : { data: null, trace };
    },
  };
}

describe("C · matching con IA", () => {
  const responses = walk();
  const profile = buildProfile(responses, base);
  const candidates = selectCandidates(profile);
  const ids = candidates.map((c) => c.career.id) as [string, ...string[]];
  const items = digest(responses).map((d) => d.itemId) as [string, ...string[]];

  it("el esquema rechaza carreras que no están entre las candidatas", () => {
    const schema = matcherSchema(ids, items);
    const bad = schema.safeParse({
      recommendations: [{
        career_id: "carrera-inventada", kind: "principal", level: "clara", why: "x", evidence: [],
        matching_interests: [], activities: [], misfits: [], unknowns: [], related_career_ids: [],
      }],
    });
    expect(bad.success).toBe(false);
  });

  it("completa instituciones desde el catálogo y deduplica", () => {
    const rec = {
      career_id: ids[0], kind: "principal" as const, level: "clara" as const, why: "Porque sí.",
      evidence: [{ item_id: items[0], note: "Lo dijiste." }], matching_interests: ["crear"],
      activities: ["proyectos"], misfits: [], unknowns: [], related_career_ids: [ids[1]],
    };
    const out = toRecommendations({ recommendations: [rec, rec] }, { digest: digest(responses), context: profile.context });
    expect(out).toHaveLength(1);
    expect(out[0].institutions.length).toBeGreaterThan(0);
    expect(out[0].name).toBe(CAREER_BY_ID.get(ids[0])!.name);
    expect(out[0].evidence[0].prompt.length).toBeGreaterThan(0);
  });
});

describe("B · planificador de preguntas", () => {
  const candidates = QUESTION_BANK.slice(5, 10).map((item) => ({ item, score: 1, reason: "test" }));
  const schema = plannerSchema(candidates.map((c) => c.item.id) as [string, ...string[]]);

  it("convierte una pregunta generada válida en un ítem con señales acotadas", () => {
    const out = schema.parse({
      action: "generate", item_id: null, rationale: "profundizar",
      question: {
        format: "scenario", dimension: "intereses", prompt: "Te invitan a un hackatón de una semana. ¿Qué rol tomás?",
        helper: null, statement_signals: [], probes: ["int.tecnologia"],
        options: [
          { label: "Programo", signals: [{ facet: "int.tecnologia", weight: 9 }] },
          { label: "Diseño la experiencia", signals: [{ facet: "int.arte_diseno", weight: 1 }] },
          { label: "Presento el proyecto", signals: [{ facet: "mod.persuadir", weight: 1 }] },
        ],
      },
    });
    const item = toItem(out, { candidates, nextGenIndex: 1, allowOpen: true });
    expect(item?.id).toBe("gen-1");
    expect(item && "options" in item && item.options[0].signals?.["int.tecnologia"]).toBe(1.5);
  });

  it("descarta preguntas mal formadas y abiertas sin consentimiento", () => {
    const tooFew = schema.parse({
      action: "generate", item_id: null, rationale: "",
      question: { format: "single", dimension: "valores", prompt: "¿Qué preferís hacer los fines de semana?", helper: null, statement_signals: [], probes: [], options: [{ label: "A", signals: [] }] },
    });
    expect(toItem(tooFew, { candidates, nextGenIndex: 1, allowOpen: true })).toBeNull();
    const open = schema.parse({
      action: "generate", item_id: null, rationale: "",
      question: { format: "open", dimension: "valores", prompt: "¿Qué problema te gustaría resolver?", helper: null, statement_signals: [], probes: [], options: [] },
    });
    expect(toItem(open, { candidates, nextGenIndex: 1, allowOpen: false })).toBeNull();
  });
});

describe("pipeline del informe", () => {
  it("si la IA falla, el informe se completa con reglas y lo indica", async () => {
    const report = await buildAIReport(fakeLLM({}), walk(), base);
    expect(report.engine.mode).toBe("reglas");
    expect(report.engine.note).toBeTruthy();
    expect(report.principal.length).toBeGreaterThanOrEqual(3);
    expect(report.engine.trace.map((t) => t.task)).toEqual(["profile_synthesis", "career_matching", "report_writer"]);
  });

  it("con IA usa sus elecciones y registra modelo y versión de prompt", async () => {
    const responses = walk();
    const profile = buildProfile(responses, base);
    const ids = selectCandidates(profile).map((c) => c.career.id);
    const items = digest(responses).map((d) => d.itemId);
    const pick = (id: string, kind: "principal" | "descubrimiento") => ({
      career_id: id, kind, level: kind === "principal" ? "clara" : "exploratoria", why: "Se conecta con lo que contaste.",
      evidence: [{ item_id: items[0], note: "Respaldo." }], matching_interests: ["crear"], activities: ["proyectos"],
      misfits: ["Mucha matemática"], unknowns: ["Si te gusta leer mucho"], related_career_ids: [],
    });
    const llm = fakeLLM({
      profile_synthesis: () => ({
        summary: "Te atrae crear.", primary: [{ label: "crear", detail: "d", evidence_item_ids: [items[0]] }],
        secondary: [], combinations: [], hobbies: [], tensions: [], unexplored: [],
      }),
      career_matching: () => ({
        recommendations: [pick(ids[3], "principal"), pick(ids[1], "principal"), pick(ids[2], "principal"), pick(ids[20], "descubrimiento")],
      }),
      report_writer: () => ({ narrative: "Texto.", closing: "Seguí explorando." }),
    });
    const report = await buildAIReport(llm, responses, base);
    expect(report.engine.mode).toBe("ia");
    expect(report.principal[0].careerId).toBe(ids[3]);
    expect(report.discovery[0].careerId).toBe(ids[20]);
    expect(report.profile.summary).toBe("Te atrae crear.");
    expect(report.engine.trace.every((t) => t.ok && t.model === "fake" && t.promptVersion)).toBe(true);
  });
});
