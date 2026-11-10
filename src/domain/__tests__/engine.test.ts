import { describe, expect, it } from "vitest";
import { nextStep, LIMITS } from "../methodology/engine";
import { QUESTION_BANK } from "../methodology/question-bank";
import { FACET_KEYS, isFacetKey } from "../methodology/dimensions";
import { buildReport } from "../report/build-report";
import { STUDY_FIELDS } from "../catalog/study-fields";
import { CAREER_BY_ID } from "../catalog/catalog";
import type { Answer, Item, Onboarding, ResponseRecord } from "../methodology/types";

/** Persona simulada: elige siempre la opción que más suma a sus facetas favoritas. */
function simulate(prefs: Record<string, number>, onboarding: Onboarding) {
  const responses: ResponseRecord[] = [];
  const affinity = (s?: Record<string, number | undefined>) =>
    Object.entries(s ?? {}).reduce((a, [k, w]) => a + (w ?? 0) * (prefs[k] ?? -0.2), 0);

  for (let guard = 0; guard < 80; guard++) {
    const { step } = nextStep(responses, onboarding, { allowOpen: false, canGenerate: false });
    if (step.type === "done") break;
    if (step.type === "plan") throw new Error("plan sin IA");
    responses.push({ itemId: step.item.id, itemVersion: 1, answer: answerFor(step.item, affinity) });
  }
  return responses;
}

function answerFor(item: Item, aff: (s?: Record<string, number | undefined>) => number): Answer {
  switch (item.format) {
    case "single": case "scenario": case "context": {
      const best = [...item.options].sort((a, b) => aff(b.signals) - aff(a.signals))[0];
      return { kind: "choice", optionIds: [best.id] };
    }
    case "multi": {
      const best = [...item.options].sort((a, b) => aff(b.signals) - aff(a.signals)).slice(0, item.max);
      return { kind: "choice", optionIds: best.map((o) => o.id) };
    }
    case "likert": {
      const a = aff(item.signals);
      return { kind: "scale", value: a > 1 ? 5 : a > 0.3 ? 4 : a > -0.3 ? 3 : a > -1 ? 2 : 1 };
    }
    case "bipolar": {
      const d = aff(item.right.signals) - aff(item.left.signals);
      return { kind: "scale", value: d > 1 ? 2 : d > 0.2 ? 1 : d < -1 ? -2 : d < -0.2 ? -1 : 0 };
    }
    default: return { kind: "skip" };
  }
}

const base: Onboarding = { edad: "17", anio: "5", zona: "caba", areasConocidas: [], aceptaIA: false };

describe("banco de preguntas", () => {
  it("usa solo facetas conocidas e ids únicos", () => {
    const ids = new Set<string>();
    for (const item of QUESTION_BANK) {
      expect(ids.has(item.id)).toBe(false);
      ids.add(item.id);
      const sigs = "options" in item ? item.options.map((o) => o.signals ?? {})
        : item.format === "likert" ? [item.signals]
        : item.format === "bipolar" ? [item.left.signals, item.right.signals] : [];
      for (const s of sigs) for (const k of Object.keys(s)) expect(isFacetKey(k), `${item.id}:${k}`).toBe(true);
    }
    for (const f of STUDY_FIELDS) for (const k of Object.keys(f.profile)) expect(FACET_KEYS).toContain(k);
  });
});

describe("motor adaptativo", () => {
  it("termina entre los límites y cubre todas las dimensiones", () => {
    const r = simulate({ "int.tecnologia": 1, "mod.analizar": 1, "hab.numerica": 1, "acad.matematica": 0.8 }, base);
    expect(r.length).toBeGreaterThanOrEqual(LIMITS.min);
    expect(r.length).toBeLessThanOrEqual(LIMITS.max);
    // profundizó en tecnología
    expect(r.some((x) => x.itemId.startsWith("deep-tec"))).toBe(true);
  });

  it("personas distintas reciben recorridos distintos", () => {
    const a = simulate({ "int.tecnologia": 1, "mod.analizar": 1 }, base).map((r) => r.itemId);
    const b = simulate({ "int.salud": 1, "mod.ayudar": 1, "val.cuidado": 1 }, base).map((r) => r.itemId);
    expect(a.join()).not.toEqual(b.join());
    expect(b.some((id) => id === "deep-salud-lugar")).toBe(true);
  });

  it("pregunta si un interés fuerte es pasatiempo o vocación", () => {
    const r = simulate({ "int.arte_diseno": 1, "mod.crear": 1, "mot.expresion": 1 }, base);
    expect(r.some((x) => x.itemId === "hob-int.arte_diseno")).toBe(true);
  });

  it("sin IA recomienda carreras reales del catálogo, coherentes y explicadas", () => {
    const r = simulate({ "int.salud": 1, "mod.ayudar": 1, "val.cuidado": 1, "hab.interpersonal": 0.8 }, base);
    const report = buildReport(r, base);
    const names = report.principal.map((m) => m.careerId);
    expect(names.some((id) => ["medicina", "enfermeria", "psicologia"].includes(id))).toBe(true);
    expect(report.principal.length).toBeGreaterThanOrEqual(4);
    for (const m of report.principal) {
      expect(CAREER_BY_ID.has(m.careerId)).toBe(true);
      expect(m.institutions.length).toBeGreaterThan(0);
      expect(m.matchingInterests.length).toBeGreaterThan(0);
      expect(m.institutions.every((i) => i.programs.every((p) => p.source.startsWith("https://")))).toBe(true);
    }
  });
});

describe("validación del estado", () => {
  it("acepta respuestas a preguntas generadas y señales parciales", async () => {
    const { AssessmentStateSchema } = await import("../methodology/schemas");
    const ok = AssessmentStateSchema.safeParse({
      onboarding: base,
      responses: [{
        itemId: "gen-1", itemVersion: 1, answer: { kind: "choice", optionIds: ["a"] },
        derived: { signals: { "int.tecnologia": 1 }, themes: ["videojuegos"] },
        generatedItem: {
          id: "gen-1", version: 1, dimension: "intereses", kind: "deep", format: "scenario", generated: true,
          prompt: "Te invitan a un hackatón. ¿Qué rol tomás?",
          options: [
            { id: "a", label: "Programo", signals: { "int.tecnologia": 1 } },
            { id: "b", label: "Diseño", signals: {} },
            { id: "c", label: "Presento", signals: { "mod.persuadir": 1 } },
          ],
        },
      }],
    });
    expect(ok.success).toBe(true);
  });
});
