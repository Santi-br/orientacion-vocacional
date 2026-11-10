import type { ProgramLevel } from "../catalog/classify";

export type AffinityLevel = "muy_marcada" | "clara" | "posible" | "exploratoria";

/** Significado de cada nivel. Nunca es una probabilidad de éxito. */
export const AFFINITY: Record<AffinityLevel, { label: string; meaning: string }> = {
  muy_marcada: { label: "Afinidad muy marcada", meaning: "Muchas de tus respuestas, de distintas dimensiones, apuntan hacia acá." },
  clara: { label: "Afinidad clara", meaning: "Varias respuestas se relacionan con esta carrera, aunque no todas." },
  posible: { label: "Afinidad posible", meaning: "Hay puntos en común, pero también cosas que no sabemos o no encajan." },
  exploratoria: { label: "Para explorar", meaning: "Una conexión menos obvia que vale la pena mirar con curiosidad." },
};

export type EvidenceRef = { itemId: string; prompt: string; answer: string; note: string };

export type InstitutionOffer = {
  institutionId: string;
  shortName: string;
  name: string;
  sector: "publica" | "privada";
  website: string;
  programs: {
    officialName: string;
    units: string[];
    level: ProgramLevel;
    orientations: string[];
    startNote?: string;
    modality?: string;
    durationText?: string;
    source: string;
    verifiedAt: string;
  }[];
  campuses: { name: string; address: string; zone: string }[];
  matchesSector: boolean | null; // null = sin preferencia
  campusInZone: boolean | null; // null = sedes no verificadas
};

export type Recommendation = {
  careerId: string;
  name: string;
  kind: "principal" | "descubrimiento";
  level: AffinityLevel;
  why: string;
  evidence: EvidenceRef[];
  matchingInterests: string[];
  activities: string[]; // orientativo: no son materias de un plan concreto
  misfits: string[];
  unknowns: string[];
  related: { careerId: string; name: string }[];
  institutions: InstitutionOffer[];
  pendingData: string[];
};

export type ProfileTheme = { label: string; detail: string };

export type ExploratoryProfile = {
  summary: string;
  primary: ProfileTheme[];
  secondary: ProfileTheme[];
  combinations: ProfileTheme[];
  hobbies: ProfileTheme[];
  tensions: ProfileTheme[];
  unexplored: string[];
};

export type AITrace = { task: string; model: string; promptVersion: string; ok: boolean };

export type Report = {
  methodologyVersion: string;
  catalogVersion: string;
  generatedAt: string;
  answeredCount: number;
  engine: { mode: "ia" | "reglas"; note?: string; trace: AITrace[] };
  profile: ExploratoryProfile;
  highlights: { dimension: string; label: string; items: string[] }[];
  context: Record<string, string>;
  principal: Recommendation[];
  discovery: Recommendation[];
  narrative?: string;
  closing?: string;
};
