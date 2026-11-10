/**
 * Representación legible de las respuestas para la IA y para el informe.
 * No incluye edad, año escolar ni zona: no hacen falta para interpretar.
 */
import { FACETS } from "../methodology/dimensions";
import { interpret, resolveItem, type Profile } from "../methodology/profile";
import type { ResponseRecord } from "../methodology/types";

export type DigestLine = { itemId: string; dimension: string; prompt: string; answer: string };

export function digest(responses: ResponseRecord[]): DigestLine[] {
  const out: DigestLine[] = [];
  for (const r of responses) {
    const item = resolveItem(r);
    if (!item || r.answer.kind === "skip") continue;
    let answer = "";
    if (r.answer.kind === "text") answer = `«${r.answer.text}»`;
    else if (item.format === "context") continue; // el contexto va aparte
    else answer = interpret(item, r).map((x) => x.label).join(" · ") || "En el medio";
    out.push({ itemId: r.itemId, dimension: item.dimension, prompt: item.prompt, answer });
  }
  return out;
}

export function digestText(lines: DigestLine[]): string {
  return lines.map((l) => `[${l.itemId}] (${l.dimension}) ${l.prompt}\n  → ${l.answer}`).join("\n");
}

/** Resumen compacto de facetas para la IA: lo más alto y lo más bajo por dimensión. */
export function facetSnapshot(p: Profile): string {
  const facets = Object.values(p.facets).filter((f) => f.evidence.length > 0);
  const hi = facets.filter((f) => f.score >= 0.25).sort((a, b) => b.score - a.score).slice(0, 14);
  const lo = facets.filter((f) => f.score <= -0.2).sort((a, b) => a.score - b.score).slice(0, 6);
  const fmt = (f: (typeof facets)[number]) =>
    `${f.key} (${FACETS[f.key].label}): ${f.score.toFixed(2)} · ${f.evidence.length} evid.`;
  return [
    "A favor:",
    ...hi.map(fmt),
    "En contra:",
    ...lo.map(fmt),
    `Tensiones: ${p.tensions.map((k) => FACETS[k].label).join(", ") || "ninguna"}`,
  ].join("\n");
}
