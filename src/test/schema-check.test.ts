import { it, expect } from "vitest";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import { FACET_KEYS } from "@/domain/methodology/dimensions";
import { matcherSchema } from "@/server/ai/career-matcher";
import { plannerSchema } from "@/server/ai/question-planner";
import { profileSchema } from "@/server/ai/profile-analyzer";

it("los esquemas de IA se convierten a JSON Schema estricto", () => {
  const facet = z.enum(FACET_KEYS as [string, ...string[]]);
  const schemas = {
    matcher: matcherSchema(["a", "b"], ["x", "y"]),
    planner: plannerSchema(["q1", "q2"]),
    profile: profileSchema(["x"]),
    open: z.object({ signals: z.array(z.object({ facet, weight: z.number() })), themes: z.array(z.string()), hobby_hint: z.string().nullable(), wellbeing_flag: z.boolean() }),
    report: z.object({ narrative: z.string(), closing: z.string() }),
  };
  for (const [name, s] of Object.entries(schemas)) {
    const f = zodTextFormat(s, name);
    expect(f.strict).toBe(true);
    const json = JSON.stringify(f.schema);
    expect(json).not.toContain('"additionalProperties":true');
  }
});
