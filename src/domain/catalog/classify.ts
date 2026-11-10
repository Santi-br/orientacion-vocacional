/**
 * Clasificación EDITORIAL de ofertas del catálogo.
 *
 * Nada de lo que hay acá es un dato institucional: es cómo PROJECT agrupa las
 * ofertas oficiales para poder razonar sobre ellas. Se deriva únicamente del
 * nombre oficial de la oferta.
 *  - level: tipo de formación inferido del nombre (licenciatura, profesorado…).
 *  - fields: campos de estudio (study-fields.ts) a los que se asocia.
 *  - careerKey: clave para agrupar la "misma carrera" entre instituciones.
 */

export type ProgramLevel =
  | "grado"
  | "profesorado"
  | "tecnicatura"
  | "pregrado"
  | "ciclo" // ciclo de complementación: requiere título previo, no aplica a quien termina el secundario
  | "programa_conjunto";

export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function inferLevel(officialName: string): ProgramLevel {
  const n = normalize(officialName);
  if (/ciclo de (complementacion|licenciatura)|\(complementacion\)|^ciclo de/.test(n)) return "ciclo";
  if (/programa conjunto/.test(n)) return "programa_conjunto";
  if (/^profesor/.test(n)) return "profesorado";
  if (/^tecnicatura/.test(n)) return "tecnicatura";
  if (/^analista|^carrera corta|^critico universitario/.test(n)) return "pregrado";
  return "grado";
}

/** Reglas ordenadas: nombre normalizado → campos. Una oferta puede caer en varios. */
const RULES: [RegExp, string[]][] = [
  // Tecnología y datos
  [/inteligencia artificial|ciencias? de datos|analisis de datos|data science|analitica|estadistica|bioinformatica/, ["datos_ia"]],
  [/informatica|computacion|sistemas de informacion|analisis de sistemas|analista .*sistemas|tecnologia de la informacion|ciberseguridad|redes y comunicacion|administracion de sistemas|negocios y tecnologia|ciberdelitos/, ["sistemas"]],
  [/videojuegos|esports|deportes electronicos|productos interactivos|realidad virtual|multimedia y de interaccion|comunicacion digital e interactiva/, ["videojuegos"]],
  [/sistemas de informacion geografica/, ["ambiente", "sistemas"]],
  // Ingenierías
  [/ingenieria (civil|en agrimensura)|^ing\. civil|construccion de obras/, ["ing_civil"]],
  [/ingenieria industrial|^ing\. industrial|organizacion de la produccion|logistica|higiene y seguridad/, ["ing_industrial"]],
  [/electronica|electrica|electromecanica|mecanica|naval|telecomunicaciones|bioingenieria|ingenieria de sonido|ingenieria en computacion|mecatronica/, ["ing_electromecanica"]],
  [/ingenieria (quimica|en alimentos|en petroleo)|^ing\. (quimica|en petroleo)|tecnologia industrial de los alimentos|ciencia y tecnologia de alimentos/, ["ing_quimica_alimentos"]],
  [/ambiental|tecnologias sustentables|paisaje|proteccion civil|atmosfera|oceanograficas|geologic/, ["ambiente"]],
  // Ciencias
  [/biologic|bioinformatica|biotecnologia|paleontologia|bioterios|biologia/, ["biologia_biotec"]],
  [/matematica|fisica|quimica|actuario|ciencias de la computacion/, ["exactas"]],
  // Salud
  [/^medicina$/, ["medicina"]],
  [/enfermeria/, ["enfermeria"]],
  [/psicologia/, ["psicologia"]],
  [/ciencias del comportamiento/, ["psicologia", "economia"]],
  [/kinesiologia|psicomotricidad|deporte|deportiv/, ["kinesiologia_deporte"]],
  [/nutricion/, ["nutricion"]],
  [/farmacia|bioquimica/, ["farmacia_bioquimica"]],
  [/obstetricia|fonoaudiologia|podologia|bioimagenes|instrumentacion quirurgica|anestesia|hemoterapia|cardiologicas|cosmetologia|optica|medicina nuclear|terapia ocupacional|musicoterapia|servicios de salud/, ["salud_profesiones"]],
  // Agro
  [/agronomia|veterinaria|agrari|agroalimentos|agronegocios|agropecuaria|florihorticola|jardineria|vegetal organica|turismo rural/, ["agro_veterinaria"]],
  // Negocios
  [/contador|finanzas|economia y finanzas/, ["contabilidad"]],
  [/economia/, ["economia"]],
  [/administracion de empresas|^licenciatura en administracion$|administracion$|management|negocios|startups|recursos humanos|relaciones del trabajo|comercio (exterior|internacional)|relaciones comerciales|comercializacion y direccion|gestion de medios|gestion deportiva|gestion del arte|produccion y gestion de las artes|gestion de servicios de salud|gestion de tecnologia|gestion educativa/, ["administracion"]],
  [/marketing|comercializacion|publicidad|relaciones publicas|direccion de comunicacion|direccion creativa/, ["publicidad_marketing"]],
  // Comunicación, diseño y artes
  [/(?<!tele)comunicacion(?! de datos)|periodismo|edicion$|community management|medios y entretenimiento/, ["comunicacion"]],
  [/audiovisual|imagen y sonido|cinematografica|fotografia|diseno digital|contenidos audiovisuales/, ["audiovisual"]],
  [/musica|sonora|sonido|produccion musical/, ["musica"]],
  [/diseno grafico|comunicacion visual|ilustracion|diseno estrategico|^diseno$|licenciatura en diseno( \(|$)|diseno \+ negocios|negocios de diseno|proyectos de diseno|multimedia/, ["diseno_grafico"]],
  [/diseno industrial|diseno de interiores/, ["diseno_industrial"]],
  [/indumentaria|textil|moda|gestion de imagen/, ["diseno_moda"]],
  [/arquitectura|interiores/, ["arquitectura"]],
  [/artes escenicas|actuacion|actor|circo/, ["artes_escenicas"]],
  [/\bartes?\b(?! (escenicas|del circo))|critico universitario en arte/, ["artes_visuales"]],
  // Sociales, humanidades, educación, derecho
  [/abogacia|ciencias juridicas|caligrafo|escribania|criminologia|resolucion de conflictos/, ["derecho"]],
  [/ciencia politica|administracion publica|relaciones internacionales|estudios internacionales|politica y administracion|gobierno/, ["politica_ri"]],
  [/sociologia|trabajo social|antropologic|politicas sociales|ciencias sociales|humanidades y ciencias sociales|^ciencias sociales$/, ["sociales"]],
  [/letras|historia|filosofia|humanidades|ciencia de la informacion|archivistica|bibliotecologia|^edicion$/, ["humanidades"]],
  [/geografia/, ["sociales", "ambiente"]],
  [/educacion|trayectorias educativas|profesorado|profesor/, ["educacion"]],
  [/traductorado|lengua inglesa|idioma/, ["idiomas"]],
  [/turismo|hoteleria|hospitality|hospitalidad|eventos/, ["turismo"]],
  [/gastronomia/, ["gastronomia"]],
];

export function classifyFields(officialName: string): string[] {
  const n = normalize(officialName.replace(/\(programa conjunto[^)]*\)/i, ""));
  const out = new Set<string>();
  for (const [re, fields] of RULES) if (re.test(n)) fields.forEach((f) => out.add(f));
  return [...out];
}

/** Agrupa nombres equivalentes entre instituciones (p. ej. "Lic. en Psicología" y "PSICOLOGÍA"). */
export function careerKey(officialName: string): string {
  return normalize(officialName)
    .replace(/\(.*?\)/g, "")
    .replace(/\+ .*$/, "")
    .replace(/^lic\.\s*/, "licenciatura ")
    .replace(/^ing\.\s*/, "ingenieria ")
    .replace(/^licenciatura (en )?/, "")
    .replace(/^ingenieria /, "ingenieria ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Nombre presentable de una carrera agrupada (solo presentación). */
export function displayCareerName(names: string[]): string {
  const cleaned = names.map((n) =>
    sentenceCase(
      n
        .replace(/\(.*?\)/g, "")
        .replace(/\+ .*$/, "")
        .replace(/^Lic\.\s*/i, "Licenciatura ")
        .replace(/^Ing\.\s*/i, "Ingeniería ")
        .replace(/^Licenciatura (en )?/i, "")
        .trim(),
    ),
  );
  return cleaned.sort((a, b) => a.length - b.length)[0] ?? names[0];
}

/** Convierte TEXTO EN MAYÚSCULAS a formato de oración, respetando lo que ya viene bien escrito. */
export function sentenceCase(s: string): string {
  if (s !== s.toUpperCase()) return s.charAt(0).toUpperCase() + s.slice(1);
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
