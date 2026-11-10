# Registro de decisiones

## Decisiones del equipo (10/11/2026)

**D10 · La metodología se desarrolla con IA, sin especialistas externos por ahora.** La IA analiza respuestas, identifica patrones, profundiza intereses y recomienda carreras. El producto se presenta como herramienta de exploración y orientación vocacional asistida por IA: no es un test psicométrico validado, ni un diagnóstico, ni reemplaza la orientación profesional. Un psicólogo especializado podría sumarse después; no bloquea el MVP. *Reemplaza la exigencia anterior de revisión profesional.*

**D11 · OpenAI API como proveedor de IA.** Toda la comunicación desde el backend. Modelos elegidos consultando la documentación oficial el 10/11/2026: `gpt-6.1-sol` (razonamiento: perfil y recomendaciones) y `gpt-6-luna` (rápido: abiertas, preguntas, textos). Configurables por variables de entorno; la lógica no depende de un modelo. Detalle en `AI_ARCHITECTURE.md`.

**D12 · Arquitectura de cuatro módulos de IA** (A analizador de perfil, B preguntas adaptativas, C recomendaciones, D informe) con salidas estructuradas estrictas y respaldo determinístico en cada uno.

**D13 · Registro de modelo y versión de prompt por evaluación.** Junto con la versión de metodología y la del catálogo.

**D14 · Catálogo: 11 instituciones prioritarias, pequeño y preciso.** Fuentes oficiales únicamente; lo no verificable queda pendiente. UNSAM y UNLaM, cuyos sitios bloquean el relevamiento automatizado, quedan pendientes de carga manual. Segunda tanda: UCA, Austral, UNQ, UNGS, UNDAV, UNLa, UNAHUR, UNLZ, UNPAZ, UNaB.

**D15 · Privacidad desde el diseño, revisión legal antes del lanzamiento público.** Los requisitos técnicos (minimización, RLS, secretos en backend, borrado, retención, sin publicidad) se implementan ya. La revisión legal es un hito obligatorio antes de publicar, no un bloqueo del desarrollo.

**D16 · Orden de trabajo.** Arquitectura → diseño → metodología → preguntas adaptativas → catálogo → recomendaciones → informe → registro e historial.

## Decisiones técnicas

**D1 · Híbrido IA + reglas.** *(Actualizada por D10–D12.)* La IA es el núcleo y decide; las reglas aportan la base trazable (facetas con evidencia), preseleccionan candidatas del catálogo y sirven de respaldo. Sin clave, sin consentimiento o ante una falla, el producto funciona igual y lo indica.

**D2 · Servidor sin estado para visitantes.** El cliente envía el estado completo en cada paso; no se guardan respuestas de menores sin cuenta. Las preguntas generadas por IA viajan con su definición.

**D3 · Carreras solo del catálogo.** *(Actualizada.)* Antes el motor recomendaba áreas genéricas; ahora recomienda carreras reales. Los IDs de carrera son un `enum` en el esquema de la IA y los datos institucionales se agregan desde el catálogo.

**D4 · Niveles cualitativos de afinidad, con su significado explicado.** Nunca porcentajes.

**D5 · Modelo normalizado.** Institución → unidad académica → oferta (nombre oficial) → sedes; "carrera" como agrupación editorial entre instituciones. Ver `ACADEMIC_CATALOG.md`.

**D6 · Versionado** de metodología, ítems, prompts y catálogo.

**D7 · PDF por impresión del navegador** en el MVP; generación en servidor más adelante.

**D8 · Fuentes tipográficas autoalojadas.**

**D9 · Stack:** Next.js 16, TypeScript, Tailwind 4, Supabase/PostgreSQL, Zod 4, OpenAI SDK (Responses API), Vercel.

**D17 · El catálogo vive en JSON versionado en git durante el MVP.** Se revisa en diffs, cada dato con URL y fecha, y se carga a la base con `npm run catalog:sql`. Cuando exista el panel de administración, la base pasa a ser la fuente de verdad.

**D18 · Clasificación editorial explícita.** El tipo de formación, los campos de estudio y la agrupación en carreras se derivan del nombre oficial con reglas (`classify.ts`) y se documentan como editoriales, no como datos de la institución. Los ciclos de complementación se excluyen de las recomendaciones.

**D19 · `store: false` en OpenAI** y nada identificable en los prompts (sin edad, año ni zona).
