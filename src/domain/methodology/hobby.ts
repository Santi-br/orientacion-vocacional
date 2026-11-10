/**
 * Preguntas para diferenciar un pasatiempo de una preferencia vocacional.
 * Se generan con plantilla para los intereses más marcados: el id lleva la
 * faceta ("hob-int.tecnologia") y la definición se reconstruye siempre igual.
 */
import { FACETS, isFacetKey, type FacetKey } from "./dimensions";
import type { ChoiceItem } from "./types";

export const HOBBY_PREFIX = "hob-";

export function hobbyItem(facet: FacetKey): ChoiceItem {
  return {
    id: `${HOBBY_PREFIX}${facet}`,
    version: 1,
    dimension: "intereses",
    kind: "probe",
    format: "single",
    prompt: `Sobre ${FACETS[facet].label}: ¿cómo lo vivís?`,
    helper: "Algo puede encantarte como pasatiempo sin que quieras trabajar de eso. Las dos cosas valen.",
    probes: [facet],
    options: [
      { id: "hobby", label: "Lo disfruto como pasatiempo, no me imagino trabajando de eso", signals: { [facet]: -0.6 } },
      { id: "ambas", label: "Me gusta y podría ser parte de mi trabajo", signals: { [facet]: 0.4 } },
      { id: "trabajo", label: "Me imagino trabajando de eso", signals: { [facet]: 0.9, "mot.desafio": 0.2 } },
      { id: "nose", label: "Nunca lo pensé", signals: {} },
    ],
  };
}

export function hobbyItemFromId(id: string): ChoiceItem | undefined {
  if (!id.startsWith(HOBBY_PREFIX)) return undefined;
  const facet = id.slice(HOBBY_PREFIX.length);
  return isFacetKey(facet) && FACETS[facet].dimension === "intereses" ? hobbyItem(facet) : undefined;
}
