# Registro de decisiones

**D1 · Motor determinístico + IA acotada (híbrido).** Las reglas eligen preguntas, puntúan y recomiendan; la IA solo extrae señales de texto libre, formula ≤ 2 preguntas abiertas y redacta la síntesis. Motivo: reproducibilidad, explicabilidad, revisión profesional posible y nada inventado. La app funciona completa sin IA.

**D2 · Servidor sin estado para visitantes.** El cliente envía el estado completo en cada paso. Motivo: privacidad (no guardamos respuestas de menores sin cuenta), simplicidad y escala en serverless. Costo: payload de algunos KB por request, aceptable.

**D3 · Áreas de estudio en vez de carreras inventadas.** Hasta tener catálogo verificado, el motor recomienda *áreas* con perfiles metodológicos y lo dice explícitamente. Motivo: el brief prohíbe datos ficticios presentados como reales.

**D4 · Niveles cualitativos de afinidad.** Sin porcentajes. Motivo: evitar que se lea como probabilidad de éxito.

**D5 · Carrera ≠ oferta (careers / programs / program_campuses).** Permite N instituciones por carrera y distintas sedes y modalidades por oferta.

**D6 · Versionado de metodología e ítems.** Cada respuesta guarda la versión del ítem; cada evaluación la de la metodología.

**D7 · PDF por impresión del navegador (MVP).** CSS `@media print` dedicado. En Etapa 2, generación en servidor para un PDF con diseño propio.

**D8 · Fuentes autoalojadas.** `@fontsource`: sin dependencia de Google Fonts en build ni en runtime.

**D9 · Stack.** Se mantuvo el propuesto (Next.js 16, TS, Tailwind 4, Supabase, Zod, Vercel). El proveedor de IA queda aislado en un archivo para poder cambiarlo.
