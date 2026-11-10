/**
 * CAMPOS DE ESTUDIO — perfiles exploratorios.
 *
 * Esto NO es el catálogo académico. Son áreas de estudio genéricas con un
 * perfil de facetas que el motor usa para encontrar afinidades. No contienen
 * datos institucionales (duración, títulos, sedes, aranceles): esos datos
 * viven únicamente en el catálogo verificado (tablas careers / programs),
 * cargados desde fuentes oficiales con fecha de verificación.
 *
 * Los pesos son criterios de trabajo del equipo (no validados psicométricamente);
 * pueden revisarse más adelante con profesionales, pero no bloquean el MVP.
 * Cada oferta del catálogo verificado se clasifica en uno o más campos
 * (src/domain/catalog/classify.ts). Sirven para preseleccionar candidatas.
 */
import type { FacetKey } from "../methodology/dimensions";

export type StudyField = {
  id: string;
  name: string;
  summary: string; // descripción general del área, sin datos institucionales
  profile: Partial<Record<FacetKey, number>>; // -1..1
};

export const STUDY_FIELDS_STATUS = "exploratorio" as const;

export const STUDY_FIELDS: StudyField[] = [
  { id: "sistemas", name: "Sistemas e informática", summary: "Programación, arquitectura de software, redes y cómo diseñar sistemas que funcionen a escala.",
    profile: { "int.tecnologia": 1, "mod.analizar": 0.7, "hab.numerica": 0.6, "hab.digital": 0.8, "mot.desafio": 0.5, "acad.matematica": 0.6, "vida.flexible": 0.3 } },
  { id: "datos_ia", name: "Ciencia de datos e inteligencia artificial", summary: "Estadística, programación y modelos que aprenden de datos para encontrar patrones y tomar decisiones.",
    profile: { "int.tecnologia": 0.8, "int.ciencias_exactas": 0.8, "mod.analizar": 1, "hab.numerica": 0.9, "acad.matematica": 0.9, "val.innovacion": 0.5, "mot.desafio": 0.6 } },
  { id: "videojuegos", name: "Desarrollo y diseño de videojuegos", summary: "Diseño de mecánicas y mundos, arte digital y programación para crear experiencias interactivas.",
    profile: { "int.tecnologia": 0.8, "int.arte_diseno": 0.8, "mod.crear": 1, "hab.digital": 0.8, "pref.equipo": 0.4, "mot.expresion": 0.5, "acad.practica": 0.5 } },
  { id: "diseno_grafico", name: "Diseño gráfico y comunicación visual", summary: "Identidad, tipografía, editorial e interfaces: comunicar ideas a través de lo visual.",
    profile: { "int.arte_diseno": 1, "mod.crear": 0.8, "hab.visual": 1, "int.comunicacion": 0.5, "hab.digital": 0.5, "acad.practica": 0.6 } },
  { id: "audiovisual", name: "Imagen, sonido y producción audiovisual", summary: "Cine, video, sonido y música para medios: narrar con imágenes y sonido.",
    profile: { "int.arte_diseno": 0.9, "int.comunicacion": 0.8, "mod.crear": 0.9, "mot.expresion": 0.8, "hab.visual": 0.6, "hab.digital": 0.5, "vida.flexible": 0.5, "pref.equipo": 0.4 } },
  { id: "diseno_industrial", name: "Diseño industrial y de producto", summary: "Diseñar objetos y productos que resuelvan problemas: forma, materiales y fabricación.",
    profile: { "int.arte_diseno": 0.7, "int.ingenieria": 0.6, "mod.crear": 0.8, "mod.construir": 0.7, "hab.visual": 0.8, "hab.manual": 0.5, "acad.practica": 0.7 } },
  { id: "arquitectura", name: "Arquitectura y urbanismo", summary: "Proyectar espacios, edificios y ciudades combinando técnica, arte y vida social.",
    profile: { "int.arte_diseno": 0.7, "int.ingenieria": 0.7, "hab.visual": 1, "mod.crear": 0.7, "acad.corta": -0.5, "mot.desafio": 0.4, "acad.practica": 0.4 } },
  { id: "ing_industrial", name: "Ingeniería industrial", summary: "Optimizar procesos, producción y organizaciones con herramientas de ingeniería y gestión.",
    profile: { "int.ingenieria": 0.7, "int.negocios": 0.6, "mod.organizar": 0.9, "mod.analizar": 0.7, "hab.numerica": 0.7, "acad.matematica": 0.8, "acad.corta": -0.4 } },
  { id: "ing_electromecanica", name: "Ingenierías electrónica, mecánica y afines", summary: "Máquinas, circuitos, energía y automatización: diseñar y construir sistemas físicos.",
    profile: { "int.ingenieria": 1, "int.ciencias_exactas": 0.6, "mod.construir": 0.8, "hab.manual": 0.5, "hab.numerica": 0.7, "acad.matematica": 0.9, "mot.desafio": 0.5, "acad.corta": -0.4 } },
  { id: "ing_civil", name: "Ingeniería civil y construcción", summary: "Estructuras, obras, infraestructura y planificación de lo que se construye.",
    profile: { "int.ingenieria": 1, "mod.construir": 0.6, "mod.organizar": 0.5, "hab.numerica": 0.7, "acad.matematica": 0.8, "vida.aire_libre": 0.4, "acad.corta": -0.4 } },
  { id: "medicina", name: "Medicina", summary: "Prevenir, diagnosticar y tratar enfermedades; formación larga con mucha práctica clínica.",
    profile: { "int.salud": 1, "mod.ayudar": 0.8, "val.cuidado": 0.8, "int.ciencias_naturales": 0.5, "mot.desafio": 0.5, "acad.corta": -1, "vida.publico": 0.5, "pref.estructura": 0.3 } },
  { id: "enfermeria", name: "Enfermería", summary: "Cuidado integral de pacientes en hospitales, centros de salud y comunidad.",
    profile: { "int.salud": 1, "mod.ayudar": 1, "val.cuidado": 1, "hab.interpersonal": 0.6, "acad.practica": 0.6, "vida.publico": 0.5 } },
  { id: "psicologia", name: "Psicología", summary: "Comportamiento, emociones y procesos mentales; clínica, educación, trabajo y comunidad.",
    profile: { "int.sociales": 0.8, "int.salud": 0.5, "mod.ayudar": 0.9, "hab.interpersonal": 1, "val.cuidado": 0.6, "acad.teorica": 0.5, "acad.escritura": 0.4 } },
  { id: "kinesiologia_deporte", name: "Kinesiología, educación física y deporte", summary: "Movimiento humano, rehabilitación, entrenamiento y actividad física.",
    profile: { "int.salud": 0.8, "vida.aire_libre": 0.7, "mod.ayudar": 0.6, "acad.practica": 0.8, "vida.publico": 0.5, "hab.interpersonal": 0.4 } },
  { id: "nutricion", name: "Nutrición", summary: "Alimentación, salud y hábitos, desde la clínica hasta la salud pública.",
    profile: { "int.salud": 0.9, "int.ciencias_naturales": 0.4, "mod.ayudar": 0.6, "int.educacion": 0.3, "val.cuidado": 0.5 } },
  { id: "biologia_biotec", name: "Biología, biotecnología y ciencias de la vida", summary: "Cómo funcionan los seres vivos y cómo aplicar ese conocimiento en salud, alimentos o ambiente.",
    profile: { "int.ciencias_naturales": 1, "mod.analizar": 0.8, "val.conocimiento": 0.7, "acad.practica": 0.4, "mot.desafio": 0.5, "int.salud": 0.3 } },
  { id: "ambiente", name: "Ciencias ambientales y gestión ambiental", summary: "Ecosistemas, recursos naturales, cambio climático y cómo gestionarlos.",
    profile: { "int.ciencias_naturales": 0.9, "val.sustentabilidad": 1, "mot.impacto": 0.6, "vida.aire_libre": 0.6, "mod.analizar": 0.4 } },
  { id: "exactas", name: "Matemática, física y ciencias exactas", summary: "Modelos, demostraciones y experimentos para entender las leyes de la naturaleza.",
    profile: { "int.ciencias_exactas": 1, "mod.analizar": 1, "hab.numerica": 1, "acad.matematica": 1, "val.conocimiento": 0.9, "mot.desafio": 0.8, "acad.teorica": 0.6 } },
  { id: "comunicacion", name: "Comunicación y periodismo", summary: "Medios, periodismo, contenidos y comunicación institucional.",
    profile: { "int.comunicacion": 1, "hab.verbal": 0.8, "acad.escritura": 0.6, "int.sociales": 0.5, "vida.publico": 0.4, "vida.flexible": 0.4 } },
  { id: "publicidad_marketing", name: "Publicidad y marketing", summary: "Marcas, campañas, comportamiento del consumidor y estrategia comercial.",
    profile: { "int.comunicacion": 0.8, "int.negocios": 0.8, "mod.persuadir": 0.8, "mod.crear": 0.6, "int.arte_diseno": 0.3, "pref.equipo": 0.4 } },
  { id: "administracion", name: "Administración y gestión de empresas", summary: "Dirigir y organizar organizaciones: estrategia, personas, finanzas y operaciones.",
    profile: { "int.negocios": 1, "mod.organizar": 0.8, "mod.persuadir": 0.6, "pref.equipo": 0.5, "mot.reconocimiento": 0.4, "pref.estructura": 0.3 } },
  { id: "economia", name: "Economía", summary: "Cómo se producen y distribuyen los recursos; análisis de mercados y políticas.",
    profile: { "int.negocios": 0.6, "int.sociales": 0.6, "mod.analizar": 0.9, "hab.numerica": 0.8, "acad.matematica": 0.7, "int.leyes_politica": 0.3 } },
  { id: "contabilidad", name: "Contabilidad y finanzas", summary: "Registros, impuestos, auditoría y finanzas de organizaciones y personas.",
    profile: { "int.negocios": 0.8, "mod.organizar": 0.9, "hab.numerica": 0.8, "pref.estructura": 0.8, "mot.estabilidad": 0.6, "vida.rutina": 0.4 } },
  { id: "derecho", name: "Derecho", summary: "Normas, derechos y conflictos: cómo se interpretan y aplican las leyes.",
    profile: { "int.leyes_politica": 1, "hab.verbal": 0.8, "acad.escritura": 0.7, "acad.teorica": 0.7, "mod.persuadir": 0.6, "val.equidad": 0.6, "mod.analizar": 0.4 } },
  { id: "politica_ri", name: "Ciencia política y relaciones internacionales", summary: "Poder, instituciones, Estado y vínculos entre países.",
    profile: { "int.leyes_politica": 1, "int.sociales": 0.7, "mod.analizar": 0.6, "acad.teorica": 0.7, "acad.escritura": 0.6, "vida.viajes": 0.3 } },
  { id: "sociales", name: "Sociología, antropología y trabajo social", summary: "Cómo funcionan las sociedades y cómo intervenir sobre problemas sociales.",
    profile: { "int.sociales": 1, "val.equidad": 0.8, "mot.impacto": 0.6, "mod.analizar": 0.5, "mod.ayudar": 0.5, "acad.teorica": 0.6 } },
  { id: "educacion", name: "Educación y profesorados", summary: "Enseñar una disciplina o acompañar procesos de aprendizaje en distintos niveles.",
    profile: { "int.educacion": 1, "mod.ayudar": 0.7, "hab.verbal": 0.6, "vida.publico": 0.6, "hab.interpersonal": 0.5, "mot.impacto": 0.5, "mot.estabilidad": 0.3 } },
  { id: "humanidades", name: "Letras, historia y filosofía", summary: "Textos, ideas y el pasado para entender la cultura y el pensamiento.",
    profile: { "int.humanidades": 1, "acad.teorica": 0.9, "acad.escritura": 0.9, "hab.verbal": 0.7, "val.conocimiento": 0.8, "mod.analizar": 0.5 } },
  { id: "musica", name: "Música y producción musical", summary: "Interpretación, composición, producción y tecnología del sonido.",
    profile: { "int.arte_diseno": 0.9, "mot.expresion": 1, "mod.crear": 0.8, "vida.flexible": 0.5, "hab.digital": 0.3, "acad.practica": 0.6 } },
  { id: "artes_visuales", name: "Artes visuales", summary: "Pintura, escultura, fotografía e instalación como formas de expresión.",
    profile: { "int.arte_diseno": 1, "mot.expresion": 1, "mod.crear": 0.9, "hab.visual": 0.8, "mot.autonomia": 0.5, "hab.manual": 0.4 } },
  { id: "turismo", name: "Turismo y hotelería", summary: "Organizar experiencias de viaje y gestionar servicios turísticos.",
    profile: { "vida.viajes": 0.9, "vida.publico": 0.7, "mod.organizar": 0.6, "int.negocios": 0.4, "hab.interpersonal": 0.5, "acad.corta": 0.3 } },
  { id: "gastronomia", name: "Gastronomía", summary: "Cocina profesional, técnicas, gestión y creación de propuestas gastronómicas.",
    profile: { "mod.construir": 0.7, "mod.crear": 0.7, "hab.manual": 0.7, "acad.practica": 1, "acad.corta": 0.5, "vida.flexible": 0.2, "pref.equipo": 0.4 } },
  { id: "agro_veterinaria", name: "Agro, veterinaria y producción de alimentos", summary: "Producción agropecuaria, salud animal, agroalimentos y paisaje.",
    profile: { "int.ciencias_naturales": 0.9, "vida.aire_libre": 0.8, "val.sustentabilidad": 0.5, "mod.construir": 0.4, "int.negocios": 0.3, "acad.practica": 0.5 } },
  { id: "farmacia_bioquimica", name: "Farmacia y bioquímica", summary: "Medicamentos, análisis clínicos y química aplicada a la salud.",
    profile: { "int.salud": 0.8, "int.ciencias_naturales": 0.8, "mod.analizar": 0.8, "pref.estructura": 0.5, "acad.practica": 0.4, "val.cuidado": 0.4 } },
  { id: "salud_profesiones", name: "Otras profesiones de la salud", summary: "Obstetricia, fonoaudiología, terapia ocupacional, imágenes, instrumentación y otras áreas clínicas y técnicas.",
    profile: { "int.salud": 1, "mod.ayudar": 0.7, "val.cuidado": 0.7, "acad.practica": 0.7, "hab.manual": 0.4, "acad.corta": 0.3 } },
  { id: "idiomas", name: "Idiomas y traducción", summary: "Lenguas extranjeras, traducción e interpretación.",
    profile: { "hab.verbal": 1, "acad.escritura": 0.8, "int.humanidades": 0.6, "vida.flexible": 0.4, "vida.viajes": 0.4, "pref.estructura": 0.3 } },
  { id: "diseno_moda", name: "Diseño de indumentaria, textil y moda", summary: "Diseño de ropa y textiles, producción y comunicación de moda.",
    profile: { "int.arte_diseno": 1, "mod.crear": 0.9, "hab.visual": 0.8, "mot.expresion": 0.7, "hab.manual": 0.5, "int.negocios": 0.3 } },
  { id: "artes_escenicas", name: "Artes escénicas", summary: "Actuación, circo, artes performáticas y producción de espectáculos.",
    profile: { "int.arte_diseno": 0.8, "mot.expresion": 1, "vida.publico": 0.8, "pref.equipo": 0.5, "hab.verbal": 0.4, "acad.practica": 0.7 } },
  { id: "ing_quimica_alimentos", name: "Ingenierías química, de alimentos y de procesos", summary: "Transformar materias primas en productos: química industrial, alimentos, energía.",
    profile: { "int.ingenieria": 0.8, "int.ciencias_naturales": 0.6, "int.ciencias_exactas": 0.6, "mod.analizar": 0.7, "acad.matematica": 0.8, "mod.organizar": 0.4, "acad.corta": -0.4 } },
];
