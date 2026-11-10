import type { DimensionId, FacetKey } from "./dimensions";

/** Peso de evidencia: -2 (fuerte en contra) … +2 (fuerte a favor). */
export type Signals = Partial<Record<FacetKey, number>>;

export type ItemFormat =
  | "single" // opción múltiple, una respuesta
  | "multi" // opción múltiple, varias respuestas
  | "scenario" // situación concreta, una respuesta
  | "likert" // 1–5 cuánto te identifica
  | "bipolar" // entre dos polos
  | "open" // respuesta abierta (analizada por IA)
  | "context"; // datos de contexto (no puntúan afinidad)

export type Option = { id: string; label: string; signals?: Signals; context?: ContextPatch };

export type ContextPatch = Partial<Context>;

export type Context = {
  zona: "caba" | "gba_norte" | "gba_oeste" | "gba_sur" | "otra";
  gestion: "publica" | "privada" | "indistinto" | "no_se";
  trabajo: "si" | "quizas" | "no";
  modalidad: "presencial" | "virtual" | "mixta" | "indistinto";
};

/** Condición para que un ítem esté disponible (adaptatividad). */
export type Requirement =
  | { facetAtLeast: [FacetKey, number] } // puntaje normalizado (-1..1)
  | { anyFacetAtLeast: [FacetKey[], number] };

export type ItemKind =
  | "opening" // secuencia inicial amplia
  | "core" // cobertura de dimensiones
  | "deep" // profundiza en un área ya detectada
  | "probe"; // aclara tensiones / contradicciones

type BaseItem = {
  id: string;
  version: number;
  dimension: DimensionId;
  kind: ItemKind;
  prompt: string;
  helper?: string;
  /** Facetas que este ítem ayuda a aclarar (para profundizar o resolver tensiones). */
  probes?: FacetKey[];
  requires?: Requirement;
  /** Si es un ítem generado por IA, no pertenece al banco versionado. */
  generated?: boolean;
};

export type ChoiceItem = BaseItem & {
  format: "single" | "scenario" | "context";
  options: Option[];
};
export type MultiItem = BaseItem & { format: "multi"; options: Option[]; max: number };
export type LikertItem = BaseItem & { format: "likert"; signals: Signals };
export type BipolarItem = BaseItem & {
  format: "bipolar";
  left: { label: string; signals: Signals };
  right: { label: string; signals: Signals };
};
export type OpenItem = BaseItem & { format: "open"; placeholder?: string };

export type Item = ChoiceItem | MultiItem | LikertItem | BipolarItem | OpenItem;

/** Respuesta tal como la guarda el cliente. */
export type Answer =
  | { kind: "choice"; optionIds: string[] }
  | { kind: "scale"; value: number } // likert 1..5 · bipolar -2..2
  | { kind: "text"; text: string }
  | { kind: "skip" };

export type ResponseRecord = {
  itemId: string;
  itemVersion: number;
  answer: Answer;
  /** Señales extraídas por IA de una respuesta abierta (validadas en servidor). */
  derived?: { signals: Signals; themes: string[] };
  /** Ítems generados por IA viajan con su definición para poder interpretarse luego. */
  generatedItem?: Item;
};

export type Onboarding = {
  edad: "15" | "16" | "17" | "18" | "otra";
  anio: "3" | "4" | "5" | "6" | "egresado" | "otro";
  zona: Context["zona"];
  areasConocidas: FacetKey[]; // áreas que ya tiene en mente (opcional)
  aceptaIA: boolean; // consentimiento para que la IA analice las respuestas y arme las recomendaciones
};
