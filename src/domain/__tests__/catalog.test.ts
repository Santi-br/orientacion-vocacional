import { describe, expect, it } from "vitest";
import { CATALOG, CAREER_BY_ID, programsOf } from "../catalog/catalog";
import { STUDY_FIELDS } from "../catalog/study-fields";
import { careerKey, inferLevel } from "../catalog/classify";

const FIELD_IDS = new Set(STUDY_FIELDS.map((f) => f.id));

describe("catálogo", () => {
  it("tiene las 11 instituciones prioritarias", () => {
    expect(CATALOG.institutions.filter((i) => i.status !== "pendiente").map((i) => i.id).sort()).toEqual(
      ["itba", "ub", "uba", "uade", "udesa", "unlam", "unsam", "untref", "up", "utdt", "utn-ba"].sort(),
    );
  });

  it("cada oferta tiene fuente oficial y fecha", () => {
    for (const p of CATALOG.programs) {
      expect(p.source).toMatch(/^https:\/\//);
      expect(p.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("toda oferta elegible queda clasificada en al menos un campo conocido", () => {
    const unclassified = CATALOG.programs.filter((p) => p.level !== "ciclo" && p.fields.length === 0);
    expect(unclassified.map((p) => `${p.institutionId}: ${p.officialName}`)).toEqual([]);
    for (const p of CATALOG.programs) for (const f of p.fields) expect(FIELD_IDS.has(f), f).toBe(true);
  });

  it("los ciclos de complementación no se ofrecen como carrera", () => {
    expect(inferLevel("Historia (Ciclo de Complementación)")).toBe("ciclo");
    for (const c of CATALOG.careers) for (const p of programsOf(c.id)) expect(p.level).not.toBe("ciclo");
  });

  it("agrupa la misma carrera entre instituciones", () => {
    expect(careerKey("Lic. en Ciencias del Comportamiento")).toBe(careerKey("Licenciatura en Ciencias del Comportamiento"));
    expect(careerKey("PSICOLOGÍA")).toBe(careerKey("Licenciatura en Psicología"));
    const psico = CAREER_BY_ID.get("psicologia");
    expect(psico?.institutionIds.length).toBeGreaterThanOrEqual(3);
  });
});
