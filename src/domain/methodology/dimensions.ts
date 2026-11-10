/**
 * Dimensiones y facetas de la metodología.
 *
 * ESTADO: metodología exploratoria asistida por IA (v0.2.0). No es un instrumento psicométrico
 * validado ni un diagnóstico. Las facetas son categorías de trabajo para ordenar la evidencia de
 * las respuestas. Una revisión profesional futura es posible, pero no es requisito del MVP.
 * Ver docs/METHODOLOGY.md.
 *
 * Las facetas NO son etiquetas: una persona puede puntuar alto en muchas.
 */

export const METHODOLOGY_VERSION = "0.2.0";

export const DIMENSIONS = [
  { id: "intereses", label: "Intereses", short: "Qué te atrae" },
  { id: "personalidad", label: "Personalidad y preferencias", short: "Cómo te gusta trabajar" },
  { id: "habilidades", label: "Habilidades percibidas", short: "En qué te sentís fuerte" },
  { id: "motivaciones", label: "Motivaciones", short: "Qué te mueve" },
  { id: "valores", label: "Valores", short: "Qué te importa" },
  { id: "estilo_vida", label: "Estilo de vida deseado", short: "Cómo te imaginás tu día" },
  { id: "academicas", label: "Preferencias académicas", short: "Cómo te gusta aprender" },
  { id: "contexto", label: "Contexto y posibilidades", short: "Tu punto de partida" },
] as const;

export type DimensionId = (typeof DIMENSIONS)[number]["id"];

type FacetDef = { dimension: Exclude<DimensionId, "contexto">; label: string };

export const FACETS = {
  // 1 · Intereses (áreas)
  "int.tecnologia": { dimension: "intereses", label: "tecnología y software" },
  "int.ciencias_exactas": { dimension: "intereses", label: "matemática y física" },
  "int.ciencias_naturales": { dimension: "intereses", label: "naturaleza, biología y ambiente" },
  "int.salud": { dimension: "intereses", label: "salud y cuerpo humano" },
  "int.arte_diseno": { dimension: "intereses", label: "arte y diseño" },
  "int.comunicacion": { dimension: "intereses", label: "comunicación y medios" },
  "int.negocios": { dimension: "intereses", label: "negocios y emprendimientos" },
  "int.sociales": { dimension: "intereses", label: "sociedad y comportamiento humano" },
  "int.humanidades": { dimension: "intereses", label: "historia, filosofía y letras" },
  "int.educacion": { dimension: "intereses", label: "enseñar y acompañar aprendizajes" },
  "int.ingenieria": { dimension: "intereses", label: "máquinas, construcción y sistemas físicos" },
  "int.leyes_politica": { dimension: "intereses", label: "leyes, política y lo público" },

  // 2 · Personalidad y preferencias (modos de trabajo)
  "mod.crear": { dimension: "personalidad", label: "crear cosas nuevas" },
  "mod.analizar": { dimension: "personalidad", label: "analizar y entender a fondo" },
  "mod.ayudar": { dimension: "personalidad", label: "ayudar y acompañar a otras personas" },
  "mod.organizar": { dimension: "personalidad", label: "ordenar y planificar" },
  "mod.construir": { dimension: "personalidad", label: "hacer con las manos / lo práctico" },
  "mod.persuadir": { dimension: "personalidad", label: "convencer, liderar y negociar" },
  "pref.equipo": { dimension: "personalidad", label: "trabajar en equipo" },
  "pref.estructura": { dimension: "personalidad", label: "tener reglas y pasos claros" },

  // 3 · Habilidades percibidas
  "hab.numerica": { dimension: "habilidades", label: "números y lógica" },
  "hab.verbal": { dimension: "habilidades", label: "expresarte con palabras" },
  "hab.visual": { dimension: "habilidades", label: "lo visual y espacial" },
  "hab.interpersonal": { dimension: "habilidades", label: "entender y vincularte con otros" },
  "hab.manual": { dimension: "habilidades", label: "lo manual y técnico" },
  "hab.digital": { dimension: "habilidades", label: "herramientas digitales" },

  // 4 · Motivaciones
  "mot.impacto": { dimension: "motivaciones", label: "generar un impacto en otros" },
  "mot.expresion": { dimension: "motivaciones", label: "expresarte y crear" },
  "mot.estabilidad": { dimension: "motivaciones", label: "estabilidad y previsibilidad" },
  "mot.desafio": { dimension: "motivaciones", label: "desafíos intelectuales" },
  "mot.reconocimiento": { dimension: "motivaciones", label: "reconocimiento e ingresos" },
  "mot.autonomia": { dimension: "motivaciones", label: "independencia y autonomía" },

  // 5 · Valores
  "val.cuidado": { dimension: "valores", label: "el cuidado de las personas" },
  "val.conocimiento": { dimension: "valores", label: "el conocimiento" },
  "val.equidad": { dimension: "valores", label: "la justicia y la equidad" },
  "val.innovacion": { dimension: "valores", label: "la innovación" },
  "val.sustentabilidad": { dimension: "valores", label: "el ambiente y la sustentabilidad" },

  // 6 · Estilo de vida deseado
  "vida.aire_libre": { dimension: "estilo_vida", label: "trabajar al aire libre o en movimiento" },
  "vida.flexible": { dimension: "estilo_vida", label: "horarios flexibles o trabajo remoto" },
  "vida.publico": { dimension: "estilo_vida", label: "estar en contacto con mucha gente" },
  "vida.viajes": { dimension: "estilo_vida", label: "viajar o cambiar de lugar" },
  "vida.rutina": { dimension: "estilo_vida", label: "una rutina estable" },

  // 7 · Preferencias académicas
  "acad.corta": { dimension: "academicas", label: "formaciones más cortas" },
  "acad.teorica": { dimension: "academicas", label: "estudio teórico y lectura" },
  "acad.practica": { dimension: "academicas", label: "aprender haciendo" },
  "acad.matematica": { dimension: "academicas", label: "materias con mucha matemática" },
  "acad.escritura": { dimension: "academicas", label: "leer y escribir mucho" },
} as const satisfies Record<string, FacetDef>;

export type FacetKey = keyof typeof FACETS;
export const FACET_KEYS = Object.keys(FACETS) as FacetKey[];

export function isFacetKey(k: string): k is FacetKey {
  return k in FACETS;
}

export const INTEREST_FACETS = FACET_KEYS.filter(
  (k) => FACETS[k].dimension === "intereses",
);

/** Evidencia mínima (ítems respondidos) por dimensión antes de poder cerrar. */
export const COVERAGE_TARGET: Record<DimensionId, number> = {
  intereses: 6,
  personalidad: 4,
  habilidades: 3,
  motivaciones: 3,
  valores: 2,
  estilo_vida: 2,
  academicas: 2,
  contexto: 3,
};
