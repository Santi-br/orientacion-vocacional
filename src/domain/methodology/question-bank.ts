/**
 * Banco de preguntas v1 (borrador).
 *
 * Cada ítem lleva `version`. Si se cambia el texto o los pesos de un ítem,
 * se sube la versión: las evaluaciones guardan item + versión respondida.
 *
 * Los pesos (signals) son hipótesis de trabajo del equipo de producto, NO
 * parámetros validados. Están pensados para ser revisados por profesionales.
 */
import type { DimensionId } from "./dimensions";
import type {
  BipolarItem,
  ChoiceItem,
  Item,
  LikertItem,
  MultiItem,
  OpenItem,
  Option,
  Signals,
} from "./types";

const likert = (
  id: string,
  dimension: DimensionId,
  prompt: string,
  signals: Signals,
  extra: Partial<LikertItem> = {},
): LikertItem => ({ id, version: 1, dimension, kind: "core", format: "likert", prompt, signals, ...extra });

const bipolar = (
  id: string,
  dimension: DimensionId,
  prompt: string,
  left: BipolarItem["left"],
  right: BipolarItem["right"],
  extra: Partial<BipolarItem> = {},
): BipolarItem => ({ id, version: 1, dimension, kind: "core", format: "bipolar", prompt, left, right, ...extra });

const choice = (
  id: string,
  dimension: DimensionId,
  prompt: string,
  options: Option[],
  extra: Partial<ChoiceItem> = {},
): ChoiceItem => ({ id, version: 1, dimension, kind: "core", format: "single", prompt, options, ...extra });

const scenario = (
  id: string,
  dimension: DimensionId,
  prompt: string,
  options: Option[],
  extra: Partial<ChoiceItem> = {},
): ChoiceItem => choice(id, dimension, prompt, options, { format: "scenario", ...extra });

const multi = (
  id: string,
  dimension: DimensionId,
  prompt: string,
  max: number,
  options: Option[],
  extra: Partial<MultiItem> = {},
): MultiItem => ({ id, version: 1, dimension, kind: "core", format: "multi", prompt, options, max, ...extra });

const open = (
  id: string,
  dimension: DimensionId,
  prompt: string,
  extra: Partial<OpenItem> = {},
): OpenItem => ({ id, version: 1, dimension, kind: "core", format: "open", prompt, ...extra });

const o = (id: string, label: string, signals: Signals): Option => ({ id, label, signals });

export const QUESTION_BANK: Item[] = [
  // ───────────────────────── Apertura ─────────────────────────
  multi("op-horas", "intereses", "¿Qué cosas podrías hacer durante horas sin darte cuenta?", 3, [
    o("a", "Armar o programar algo en la compu", { "int.tecnologia": 1.5, "hab.digital": 1, "mod.crear": 0.5 }),
    o("b", "Dibujar, editar videos, diseñar o hacer música", { "int.arte_diseno": 1.5, "mod.crear": 1, "hab.visual": 0.8 }),
    o("c", "Leer o mirar cosas sobre historia, filosofía o cómo funciona la sociedad", { "int.humanidades": 1.2, "int.sociales": 1, "mod.analizar": 0.5 }),
    o("d", "Escuchar a mis amigos y ayudarlos a resolver sus problemas", { "mod.ayudar": 1.5, "hab.interpersonal": 1 }),
    o("e", "Resolver acertijos, problemas de lógica o de matemática", { "int.ciencias_exactas": 1.5, "hab.numerica": 1, "mod.analizar": 1 }),
    o("f", "Arreglar, desarmar o construir cosas", { "int.ingenieria": 1.5, "mod.construir": 1.5, "hab.manual": 1 }),
    o("g", "Organizar un evento o vender algo", { "int.negocios": 1.5, "mod.persuadir": 1, "mod.organizar": 0.5 }),
    o("h", "Hacer deporte o estar al aire libre", { "vida.aire_libre": 1.5, "int.salud": 0.5 }),
    o("i", "Crear contenido o hablar frente a otros", { "int.comunicacion": 1.5, "hab.verbal": 0.5, "mod.persuadir": 0.5 }),
    o("j", "Explorar la naturaleza, cuidar animales o plantas", { "int.ciencias_naturales": 1.5, "val.sustentabilidad": 0.5 }),
  ], { kind: "opening", helper: "Elegí hasta 3." }),

  choice("op-materias", "intereses", "En el colegio, ¿qué tipo de materia disfrutás más? (aunque no sea donde mejor te va)", [
    o("a", "Matemática o Física", { "int.ciencias_exactas": 1.5, "acad.matematica": 1.5 }),
    o("b", "Biología o Química", { "int.ciencias_naturales": 1.2, "int.salud": 0.8 }),
    o("c", "Lengua y Literatura", { "int.humanidades": 1, "acad.escritura": 1.5, "hab.verbal": 0.5 }),
    o("d", "Historia, Geografía o Ciudadanía", { "int.humanidades": 1, "int.sociales": 1, "int.leyes_politica": 0.5 }),
    o("e", "Arte, Música o Plástica", { "int.arte_diseno": 1.5, "mot.expresion": 1 }),
    o("f", "Informática o Tecnología", { "int.tecnologia": 1.5 }),
    o("g", "Educación Física", { "vida.aire_libre": 1, "int.salud": 0.5, "acad.practica": 1 }),
    o("h", "Economía, Contabilidad o Gestión", { "int.negocios": 1.5, "hab.numerica": 0.5 }),
  ], { kind: "opening" }),

  scenario("op-sabado", "intereses", "Te dan un sábado libre y recursos para un proyecto propio. ¿Qué armás?", [
    o("a", "Una app, una web o un videojuego", { "int.tecnologia": 1.5, "mod.crear": 1 }),
    o("b", "Un corto, una canción o un proyecto artístico", { "int.arte_diseno": 1.5, "int.comunicacion": 0.8, "mot.expresion": 1 }),
    o("c", "Una campaña solidaria en mi barrio", { "mod.ayudar": 1.5, "mot.impacto": 1.5, "int.sociales": 0.5 }),
    o("d", "Un microemprendimiento", { "int.negocios": 1.5, "mod.persuadir": 1, "mot.autonomia": 1 }),
    o("e", "Un experimento o una investigación", { "mod.analizar": 1.5, "int.ciencias_naturales": 0.7, "int.ciencias_exactas": 0.7, "mot.desafio": 1 }),
    o("f", "Una huerta, o restaurar un mueble o una bici", { "mod.construir": 1.5, "val.sustentabilidad": 1, "int.ciencias_naturales": 0.5 }),
  ], { kind: "opening" }),

  // ───────────────────────── Intereses (core) ─────────────────────────
  likert("int-cuerpo", "intereses", "Me da curiosidad entender cómo funciona el cuerpo humano y qué pasa cuando alguien se enferma.", { "int.salud": 2, "int.ciencias_naturales": 0.5 }),
  likert("int-politica", "intereses", "Me interesa lo que pasa con la política, las leyes y cómo se toman las decisiones públicas.", { "int.leyes_politica": 2, "int.sociales": 0.5 }),
  likert("int-ensenar", "intereses", "Me imagino explicándole algo a un grupo y viendo cómo lo entienden.", { "int.educacion": 2, "mod.ayudar": 0.5, "hab.verbal": 0.5 }),
  likert("int-construccion", "intereses", "Me interesa cómo se diseñan y se construyen puentes, edificios, máquinas o circuitos.", { "int.ingenieria": 2, "int.ciencias_exactas": 0.5 }),
  choice("int-documental", "intereses", "Si pudieras ver un documental ahora mismo, ¿de qué sería?", [
    o("a", "Inteligencia artificial y el futuro de la tecnología", { "int.tecnologia": 1.5, "val.innovacion": 1 }),
    o("b", "Cómo se hizo una película o un disco", { "int.arte_diseno": 1, "int.comunicacion": 1 }),
    o("c", "El espacio, los agujeros negros o la física cuántica", { "int.ciencias_exactas": 1.5, "mot.desafio": 0.5 }),
    o("d", "Un caso judicial o una elección", { "int.leyes_politica": 1.5 }),
    o("e", "Alguien que armó una empresa de cero", { "int.negocios": 1.5, "mot.reconocimiento": 0.5 }),
    o("f", "Océanos, clima o animales", { "int.ciencias_naturales": 1.5, "val.sustentabilidad": 0.8 }),
    o("g", "Una crisis social o un fenómeno cultural", { "int.sociales": 1.5, "int.humanidades": 0.5 }),
    o("h", "Un hospital por dentro", { "int.salud": 1.5 }),
  ]),
  multi("int-redes", "intereses", "¿Qué tipo de contenido seguís en redes?", 3, [
    o("a", "Tecnología o gaming", { "int.tecnologia": 1, "int.arte_diseno": 0.3 }),
    o("b", "Diseño, arte, moda o fotografía", { "int.arte_diseno": 1.2 }),
    o("c", "Noticias, política o debates", { "int.leyes_politica": 1, "int.sociales": 0.5 }),
    o("d", "Finanzas o emprendimientos", { "int.negocios": 1.2 }),
    o("e", "Ciencia y curiosidades", { "int.ciencias_exactas": 0.6, "int.ciencias_naturales": 0.6, "mod.analizar": 0.5 }),
    o("f", "Salud, deporte o nutrición", { "int.salud": 1 }),
    o("g", "Streamers, humor o creadores de contenido", { "int.comunicacion": 1 }),
    o("h", "Libros, historia o filosofía", { "int.humanidades": 1.2 }),
  ], { helper: "Elegí hasta 3." }),

  // ───────────────────────── Intereses (profundización) ─────────────────────────
  scenario("deep-tec-parte", "intereses", "En un proyecto de tecnología, ¿qué parte te tienta más?", [
    o("a", "Que funcione por dentro: el código, la lógica", { "mod.analizar": 1, "hab.numerica": 1, "acad.matematica": 0.5 }),
    o("b", "Cómo se ve y cómo lo usa la gente", { "int.arte_diseno": 1, "mod.crear": 0.5, "hab.visual": 1 }),
    o("c", "Los datos, los patrones, la inteligencia artificial", { "int.ciencias_exactas": 1, "mod.analizar": 1, "mot.desafio": 0.5 }),
    o("d", "El hardware: robots, circuitos, dispositivos", { "int.ingenieria": 1.5, "mod.construir": 1 }),
    o("e", "Convertirlo en un producto o un negocio", { "int.negocios": 1.5, "mod.persuadir": 0.5 }),
    o("f", "Los mundos, personajes y mecánicas de un videojuego", { "int.arte_diseno": 1, "mod.crear": 1 }),
  ], { kind: "deep", probes: ["int.tecnologia"], requires: { facetAtLeast: ["int.tecnologia", 0.35] } }),
  likert("deep-tec-bug", "intereses", "Pasar horas buscando un error en un programa me parece más un desafío que un castigo.", { "mot.desafio": 1.5, "mod.analizar": 1, "hab.numerica": 0.5, "int.tecnologia": 0.5 }, { kind: "deep", probes: ["int.tecnologia"], requires: { facetAtLeast: ["int.tecnologia", 0.35] } }),

  scenario("deep-arte-pieza", "intereses", "Si te encargan una pieza visual o sonora, ¿qué disfrutás más?", [
    o("a", "Pensar la idea y el concepto", { "mod.crear": 1.5, "int.comunicacion": 0.5 }),
    o("b", "Dominar la herramienta y el detalle técnico", { "hab.digital": 1, "hab.manual": 0.5, "mod.construir": 0.5 }),
    o("c", "Que transmita un mensaje a mucha gente", { "int.comunicacion": 1.5, "mod.persuadir": 0.5 }),
    o("d", "Que resuelva un problema concreto de alguien", { "mod.organizar": 0.5, "int.ingenieria": 0.5, "mod.ayudar": 0.5 }),
    o("e", "Expresarme sin que nadie me diga cómo", { "mot.expresion": 1.5, "mot.autonomia": 1 }),
    o("f", "Trabajar con el espacio: objetos, escenografía, edificios", { "hab.visual": 1, "int.ingenieria": 1, "mod.construir": 0.5 }),
  ], { kind: "deep", probes: ["int.arte_diseno"], requires: { facetAtLeast: ["int.arte_diseno", 0.35] } }),
  bipolar("deep-arte-proposito", "intereses", "Cuando pensás en crear, ¿hacia dónde te inclinás?",
    { label: "Arte como expresión personal", signals: { "mot.expresion": 1.5, "mot.autonomia": 0.5 } },
    { label: "Diseño al servicio de un objetivo", signals: { "mod.organizar": 0.5, "int.negocios": 0.5, "int.comunicacion": 0.5 } },
    { kind: "deep", probes: ["int.arte_diseno"], requires: { facetAtLeast: ["int.arte_diseno", 0.35] } }),

  scenario("deep-salud-lugar", "intereses", "Dentro del mundo de la salud, ¿dónde te imaginás?", [
    o("a", "Atendiendo pacientes", { "mod.ayudar": 1.5, "vida.publico": 1, "val.cuidado": 1 }),
    o("b", "En un laboratorio, investigando", { "mod.analizar": 1.5, "int.ciencias_naturales": 1, "val.conocimiento": 1 }),
    o("c", "Acompañando a personas en lo emocional", { "int.sociales": 1, "mod.ayudar": 1, "hab.interpersonal": 1 }),
    o("d", "En rehabilitación o en el deporte", { "vida.aire_libre": 0.5, "mod.construir": 0.5, "acad.practica": 1 }),
    o("e", "En prevención o salud pública", { "int.leyes_politica": 0.5, "mot.impacto": 1, "val.equidad": 0.5 }),
    o("f", "Con la alimentación y los hábitos", { "int.educacion": 0.5, "mod.ayudar": 0.5 }),
  ], { kind: "deep", probes: ["int.salud"], requires: { facetAtLeast: ["int.salud", 0.35] } }),

  scenario("deep-social-barrio", "intereses", "Te preocupa un problema de tu barrio, por ejemplo chicos que dejan la escuela. ¿Qué hacés?", [
    o("a", "Investigo las causas y busco datos", { "mod.analizar": 1.5, "int.sociales": 1 }),
    o("b", "Armo un proyecto con la comunidad", { "mod.ayudar": 1, "mod.organizar": 1, "mot.impacto": 1, "pref.equipo": 1 }),
    o("c", "Escribo o cuento la historia para que se conozca", { "int.comunicacion": 1.5, "hab.verbal": 1 }),
    o("d", "Presento una propuesta al municipio", { "int.leyes_politica": 1.5, "mod.persuadir": 1 }),
    o("e", "Doy clases de apoyo", { "int.educacion": 1.5, "mod.ayudar": 1 }),
  ], { kind: "deep", probes: ["int.sociales", "int.humanidades", "int.leyes_politica"], requires: { anyFacetAtLeast: [["int.sociales", "int.humanidades", "int.leyes_politica"], 0.35] } }),

  scenario("deep-neg-rol", "intereses", "En un emprendimiento, ¿qué rol te sale natural?", [
    o("a", "Los números: costos, precios, ganancias", { "hab.numerica": 1.5, "mod.organizar": 1 }),
    o("b", "La marca y las redes", { "int.comunicacion": 1.2, "int.arte_diseno": 0.8, "mod.persuadir": 0.5 }),
    o("c", "Vender y negociar", { "mod.persuadir": 1.5, "vida.publico": 1 }),
    o("d", "Coordinar al equipo", { "mod.organizar": 1, "mod.persuadir": 1, "pref.equipo": 1 }),
    o("e", "La idea y el producto", { "mod.crear": 1.5, "val.innovacion": 1 }),
  ], { kind: "deep", probes: ["int.negocios"], requires: { facetAtLeast: ["int.negocios", 0.35] } }),

  scenario("deep-ciencia-pregunta", "intereses", "¿Qué pregunta te parece más fascinante?", [
    o("a", "¿Por qué el universo se puede describir con matemática?", { "int.ciencias_exactas": 1.5, "val.conocimiento": 1 }),
    o("b", "¿Cómo evoluciona la vida?", { "int.ciencias_naturales": 1.5, "val.conocimiento": 0.5 }),
    o("c", "¿Podemos frenar el cambio climático?", { "int.ciencias_naturales": 1, "val.sustentabilidad": 1.5, "mot.impacto": 0.5 }),
    o("d", "¿Cómo se desarrolla un medicamento?", { "int.salud": 1, "int.ciencias_naturales": 1 }),
    o("e", "¿Cómo hacen las máquinas para aprender?", { "int.tecnologia": 1, "int.ciencias_exactas": 1, "val.innovacion": 0.5 }),
  ], { kind: "deep", probes: ["int.ciencias_exactas", "int.ciencias_naturales"], requires: { anyFacetAtLeast: [["int.ciencias_exactas", "int.ciencias_naturales"], 0.35] } }),

  scenario("deep-ing-ciudad", "intereses", "Si pudieras mejorar algo de tu ciudad, ¿qué elegirías?", [
    o("a", "El transporte y el tránsito", { "mod.organizar": 1, "mod.analizar": 0.5 }),
    o("b", "La energía: que sea más limpia", { "val.sustentabilidad": 1.5, "int.ciencias_exactas": 0.3 }),
    o("c", "Los espacios públicos: plazas, edificios", { "hab.visual": 1, "int.arte_diseno": 0.5 }),
    o("d", "Que las fábricas y procesos sean más eficientes", { "mod.organizar": 1, "int.negocios": 0.5 }),
    o("e", "Automatizar cosas con robots o sensores", { "int.tecnologia": 1, "mod.construir": 1 }),
  ], { kind: "deep", probes: ["int.ingenieria"], requires: { facetAtLeast: ["int.ingenieria", 0.35] } }),

  scenario("deep-com-historia", "intereses", "¿Cómo te gusta contar una historia?", [
    o("a", "Escribiendo", { "acad.escritura": 1, "hab.verbal": 1.5 }),
    o("b", "Con fotos o video", { "hab.visual": 1.5, "int.arte_diseno": 0.5 }),
    o("c", "Hablando frente a cámara o a un público", { "vida.publico": 1, "mod.persuadir": 1 }),
    o("d", "Investigando para que sea verdad", { "mod.analizar": 1, "int.sociales": 0.5 }),
    o("e", "Diseñando una campaña", { "mod.persuadir": 1, "int.negocios": 0.7 }),
  ], { kind: "deep", probes: ["int.comunicacion"], requires: { facetAtLeast: ["int.comunicacion", 0.35] } }),

  likert("deep-edu-adolescentes", "intereses", "Me gustaría trabajar con chicos o adolescentes.", { "int.educacion": 1, "mod.ayudar": 1, "vida.publico": 0.5 }, { kind: "deep", probes: ["int.educacion"], requires: { facetAtLeast: ["int.educacion", 0.3] } }),

  // ───────────────────────── Personalidad y preferencias ─────────────────────────
  bipolar("per-personas-cosas", "personalidad", "¿Con cuál te identificás más?",
    { label: "Trabajar con personas", signals: { "mod.ayudar": 1, "pref.equipo": 1, "vida.publico": 0.5 } },
    { label: "Trabajar con cosas, datos o ideas", signals: { "mod.analizar": 0.7, "mod.construir": 0.5, "mod.crear": 0.3 } }),
  bipolar("per-estructura", "personalidad", "En una tarea nueva, preferís…",
    { label: "Pasos claros y saber qué se espera", signals: { "pref.estructura": 1.5, "vida.rutina": 0.5 } },
    { label: "Libertad para improvisar", signals: { "pref.estructura": -1.5, "mot.autonomia": 0.8, "mod.crear": 0.5 } }),
  scenario("per-grupal", "personalidad", "Trabajo en grupo para el colegio. ¿Qué rol terminás tomando casi siempre?", [
    o("a", "Organizo y reparto las tareas", { "mod.organizar": 1.5, "mod.persuadir": 0.5 }),
    o("b", "Pienso la idea", { "mod.crear": 1.5 }),
    o("c", "Investigo y chequeo que esté bien", { "mod.analizar": 1.5 }),
    o("d", "Presento y defiendo el trabajo", { "mod.persuadir": 1.5, "hab.verbal": 0.5, "vida.publico": 0.5 }),
    o("e", "Hago que el grupo se lleve bien", { "mod.ayudar": 1, "hab.interpersonal": 1.5 }),
    o("f", "Prefiero hacer mi parte por mi cuenta", { "pref.equipo": -1.5, "mot.autonomia": 1 }),
  ]),
  likert("per-abrir", "personalidad", "Cuando algo se rompe, mi primer impulso es abrirlo para ver cómo funciona.", { "mod.construir": 1.5, "hab.manual": 1, "int.ingenieria": 0.5, "mod.analizar": 0.3 }),
  bipolar("per-ritmo", "personalidad", "¿Qué tipo de proyectos te enganchan más?",
    { label: "Ver resultados rápidos y concretos", signals: { "acad.practica": 1, "mod.construir": 0.5 } },
    { label: "Proyectos largos que maduran con el tiempo", signals: { "mot.desafio": 0.5, "mod.analizar": 0.5, "acad.teorica": 0.5 } }),
  likert("per-liderar", "personalidad", "Me sale naturalmente convencer a otros o tomar la iniciativa en un grupo.", { "mod.persuadir": 2 }, { probes: ["mod.persuadir"] }),
  scenario("probe-gente", "personalidad", "Pensá en un día de trabajo ideal. ¿Cuánta gente hay alrededor tuyo?", [
    o("a", "Casi nadie: me concentro mejor", { "pref.equipo": -1.5, "vida.publico": -1 }),
    o("b", "Un equipo chico con el que me llevo bien", { "pref.equipo": 1, "vida.publico": -0.3 }),
    o("c", "Mucha gente distinta todo el tiempo", { "pref.equipo": 0.8, "vida.publico": 1.5 }),
    o("d", "Depende del día", { "vida.flexible": 0.5, "pref.equipo": 0.3 }),
  ], { kind: "probe", probes: ["pref.equipo", "vida.publico", "mod.ayudar"] }),
  bipolar("probe-crear-orden", "personalidad", "Si tuvieras que elegir solo una, ¿cuál te gusta más?",
    { label: "Inventar algo desde cero", signals: { "mod.crear": 1.5, "pref.estructura": -0.5 } },
    { label: "Mejorar y ordenar algo que ya existe", signals: { "mod.organizar": 1.5, "pref.estructura": 0.5 } },
    { kind: "probe", probes: ["mod.crear", "mod.organizar", "pref.estructura"] }),

  // ───────────────────────── Habilidades percibidas ─────────────────────────
  multi("hab-bueno", "habilidades", "¿En qué te dicen (o sentís) que sos bueno o buena?", 3, [
    o("a", "Explicar cosas", { "hab.verbal": 1, "int.educacion": 0.5 }),
    o("b", "Cuentas y lógica", { "hab.numerica": 1.5 }),
    o("c", "Dibujar o imaginar espacios", { "hab.visual": 1.5 }),
    o("d", "Escuchar y entender a otros", { "hab.interpersonal": 1.5 }),
    o("e", "Arreglar o construir cosas", { "hab.manual": 1.5 }),
    o("f", "La compu, las apps y los programas", { "hab.digital": 1.5 }),
    o("g", "Escribir", { "hab.verbal": 1.5, "acad.escritura": 0.5 }),
    o("h", "Organizar y que no se olvide nada", { "mod.organizar": 1.5 }),
  ], { helper: "Elegí hasta 3. No hace falta ser experto." }),
  likert("hab-mate", "habilidades", "Cuando aparece un problema de matemática nuevo, puedo entenderlo aunque me cueste al principio.", { "hab.numerica": 2, "acad.matematica": 0.8 }, { probes: ["hab.numerica"] }),
  likert("hab-empatia", "habilidades", "Me doy cuenta rápido de cómo se siente alguien aunque no lo diga.", { "hab.interpersonal": 2, "mod.ayudar": 0.5 }, { probes: ["hab.interpersonal"] }),
  likert("hab-digital", "habilidades", "Aprendo rápido programas nuevos (edición, diseño, código o planillas).", { "hab.digital": 2 }),
  likert("hab-escribir", "habilidades", "Puedo escribir un texto largo y que se entienda bien.", { "hab.verbal": 1.5, "acad.escritura": 1 }),

  // ───────────────────────── Motivaciones ─────────────────────────
  choice("mot-vale", "motivaciones", "¿Qué te haría sentir que tu trabajo vale la pena?", [
    o("a", "Saber que ayudé a alguien", { "mot.impacto": 1.5, "val.cuidado": 1 }),
    o("b", "Crear algo que lleve mi sello", { "mot.expresion": 1.5 }),
    o("c", "Resolver algo que nadie había podido", { "mot.desafio": 1.5 }),
    o("d", "Tener estabilidad y tranquilidad", { "mot.estabilidad": 1.5 }),
    o("e", "Que me reconozcan y ganar bien", { "mot.reconocimiento": 1.5 }),
    o("f", "Ser mi propio jefe o jefa", { "mot.autonomia": 1.5 }),
  ]),
  bipolar("mot-riesgo", "motivaciones", "Si tuvieras que elegir hoy…",
    { label: "Un trabajo seguro, aunque sea menos emocionante", signals: { "mot.estabilidad": 1.5, "vida.rutina": 0.5 } },
    { label: "Un camino más incierto, pero con más libertad", signals: { "mot.autonomia": 1.2, "mot.estabilidad": -1 } }),
  likert("mot-salida", "motivaciones", "Que la carrera tenga buena salida laboral es lo que más pesa en mi elección.", { "mot.reconocimiento": 1, "mot.estabilidad": 1 }),
  likert("mot-profundidad", "motivaciones", "Me motiva entender las cosas en profundidad, aunque no tengan una utilidad inmediata.", { "val.conocimiento": 1, "mot.desafio": 1, "acad.teorica": 0.5 }),

  // ───────────────────────── Valores ─────────────────────────
  multi("val-causas", "valores", "¿Qué causas te importan más?", 2, [
    o("a", "Reducir la desigualdad", { "val.equidad": 1.5, "int.sociales": 0.5 }),
    o("b", "Cuidar el planeta", { "val.sustentabilidad": 1.5 }),
    o("c", "La salud y el bienestar", { "val.cuidado": 1.5, "int.salud": 0.3 }),
    o("d", "Educación para todos", { "val.equidad": 0.8, "int.educacion": 0.8 }),
    o("e", "Que la tecnología mejore la vida", { "val.innovacion": 1.5, "int.tecnologia": 0.3 }),
    o("f", "Cultura y arte accesibles", { "mot.expresion": 0.8, "int.arte_diseno": 0.5, "val.equidad": 0.3 }),
    o("g", "Derechos y justicia", { "val.equidad": 1, "int.leyes_politica": 1 }),
  ], { helper: "Elegí hasta 2." }),
  scenario("val-ofertas", "valores", "Te ofrecen varios trabajos con el mismo sueldo. ¿Cuál elegís?", [
    o("a", "En una empresa que innova", { "val.innovacion": 1.5, "mot.reconocimiento": 0.5 }),
    o("b", "En una ONG", { "mot.impacto": 1.5, "val.equidad": 1 }),
    o("c", "En un organismo público", { "mot.estabilidad": 1, "int.leyes_politica": 0.5, "val.equidad": 0.5 }),
    o("d", "En un proyecto propio", { "mot.autonomia": 1.5 }),
    o("e", "En un laboratorio o una universidad", { "val.conocimiento": 1.5 }),
  ]),

  // ───────────────────────── Estilo de vida ─────────────────────────
  multi("vida-30", "estilo_vida", "¿Cómo te imaginás tu día a día a los 30?", 3, [
    o("a", "En una oficina o un estudio", { "vida.rutina": 0.5, "vida.aire_libre": -0.5 }),
    o("b", "Al aire libre o en movimiento", { "vida.aire_libre": 1.5 }),
    o("c", "Desde casa o desde cualquier lugar", { "vida.flexible": 1.5 }),
    o("d", "Viajando", { "vida.viajes": 1.5 }),
    o("e", "Rodeado/a de mucha gente", { "vida.publico": 1.5 }),
    o("f", "Con horarios fijos y fines de semana libres", { "vida.rutina": 1.5, "vida.flexible": -0.5 }),
    o("g", "Con horarios raros, pero haciendo lo que me gusta", { "vida.flexible": 0.8, "vida.rutina": -1, "mot.expresion": 0.3 }),
  ], { helper: "Elegí hasta 3." }),
  bipolar("vida-lugar", "estilo_vida", "¿Qué te tienta más?",
    { label: "Un lugar fijo y conocido", signals: { "vida.rutina": 1, "vida.viajes": -1 } },
    { label: "Cambiar de lugares y proyectos seguido", signals: { "vida.viajes": 1, "vida.rutina": -1 } }),

  // ───────────────────────── Preferencias académicas ─────────────────────────
  bipolar("acad-duracion", "academicas", "Pensando en tu formación…",
    { label: "Prefiero algo más corto para empezar a trabajar antes", signals: { "acad.corta": 1.5 } },
    { label: "Prefiero una carrera larga y profunda", signals: { "acad.corta": -1.5, "acad.teorica": 0.5 } },
    { helper: "No hay respuesta correcta: hay caminos cortos y largos en casi todas las áreas." }),
  bipolar("acad-estilo", "academicas", "¿Cómo aprendés mejor?",
    { label: "Leyendo, debatiendo y escribiendo", signals: { "acad.teorica": 1, "acad.escritura": 1 } },
    { label: "En taller, laboratorio o haciendo proyectos", signals: { "acad.practica": 1.5 } }),
  likert("acad-mate", "academicas", "No me molestaría que la carrera tenga varias materias de matemática.", { "acad.matematica": 2 }, { probes: ["acad.matematica", "hab.numerica"] }),
  likert("acad-exigencia", "academicas", "Me imagino estudiando muchos años, con exigencia, si es por algo que me importa.", { "acad.corta": -1.2, "mot.desafio": 0.5 }),

  // ───────────────────────── Contexto ─────────────────────────
  {
    id: "ctx-gestion", version: 1, dimension: "contexto", kind: "core", format: "context",
    prompt: "¿Qué tipo de institución te imaginás?",
    helper: "Esto no descarta opciones: sirve para mostrarte alternativas.",
    options: [
      { id: "publica", label: "Pública", context: { gestion: "publica" } },
      { id: "privada", label: "Privada", context: { gestion: "privada" } },
      { id: "indistinto", label: "Me da igual", context: { gestion: "indistinto" } },
      { id: "no_se", label: "Todavía no sé", context: { gestion: "no_se" } },
    ],
  },
  {
    id: "ctx-trabajo", version: 1, dimension: "contexto", kind: "core", format: "context",
    prompt: "¿Pensás trabajar mientras estudiás?",
    options: [
      { id: "si", label: "Sí", context: { trabajo: "si" } },
      { id: "quizas", label: "Quizás", context: { trabajo: "quizas" } },
      { id: "no", label: "No", context: { trabajo: "no" } },
    ],
  },
  {
    id: "ctx-modalidad", version: 1, dimension: "contexto", kind: "core", format: "context",
    prompt: "¿Qué modalidad te gustaría?",
    options: [
      { id: "presencial", label: "Presencial", context: { modalidad: "presencial" } },
      { id: "virtual", label: "Virtual", context: { modalidad: "virtual" } },
      { id: "mixta", label: "Mixta", context: { modalidad: "mixta" } },
      { id: "indistinto", label: "Me da igual", context: { modalidad: "indistinto" } },
    ],
  },

  // ───────────────────────── Abiertas (requieren consentimiento IA) ─────────────────────────
  open("open-orgullo", "intereses", "Contanos algo que hayas hecho (en el cole, en casa o con amigos) que te haya hecho sentir orgullo. ¿Qué parte disfrutaste más?", { placeholder: "Puede ser algo chico. Lo importante es qué disfrutaste." }),
  open("open-martes", "motivaciones", "Imaginá que ya terminaste de estudiar y te va bien. ¿Qué estás haciendo un martes a la mañana?", { placeholder: "Dónde estás, con quién, qué hacés…" }),
  open("open-imposible", "intereses", "¿Hay alguna carrera o trabajo que te llame la atención pero te parezca poco realista? ¿Por qué?", { placeholder: "Si no hay ninguna, podés saltearla." }),
  open("open-problema", "valores", "¿Qué problema del mundo o de tu entorno te gustaría ayudar a resolver?"),
];

export const ITEM_BY_ID = new Map(QUESTION_BANK.map((i) => [i.id, i]));
export const OPENING_SEQUENCE = QUESTION_BANK.filter((i) => i.kind === "opening").map((i) => i.id);
