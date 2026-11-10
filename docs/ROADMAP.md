# Roadmap, hitos y riesgos

Actualizado el 10/11/2026 con las decisiones del equipo (ver `DECISIONS.md`, D10–D16).

**Ya no son bloqueos del MVP:** la contratación de psicólogos para la metodología y la de abogados para seguir desarrollando. La revisión profesional queda como posibilidad futura. La revisión legal es **obligatoria antes del lanzamiento público**.

## Hitos (en el orden de prioridad acordado)

| # | Hito | Estado |
|---|---|---|
| 1 | Arquitectura y estructura técnica | ✅ Hecho. Next.js 16 + TS, dominio puro testeado, Supabase con RLS (migraciones 0001–0002 probadas contra Postgres). |
| 2 | Sistema de diseño y experiencia visual | ✅ Base hecha (tokens, horizonte, vidrio, tipografía). Pendiente: fotografía cinematográfica propia. |
| 3 | Metodología exploratoria del test | ✅ v0.2.0 asistida por IA. **Siguiente:** correr 10–15 evaluaciones internas con clave real y ajustar prompts. |
| 4 | Motor de preguntas adaptativas | ✅ Reglas + planificador con IA (elige del banco o genera), pasatiempo vs. vocación, tensiones. |
| 5 | Catálogo académico verificado | 🟡 Primera tanda: 9 de 11 instituciones con oferta cargada (365 ofertas, 248 carreras). **Siguiente:** UNSAM y UNLaM (manual), UTN.BA completa, datos por carrera (título, duración, modalidad, ingreso). |
| 6 | Motor de recomendaciones | ✅ IA sobre catálogo verificado, con respaldo por reglas. **Siguiente:** compatibilidad práctica completa cuando haya sedes y modalidad por carrera. |
| 7 | Informe personalizado | ✅ Web + PDF por impresión. **Siguiente:** ficha de carrera, comparador, PDF generado en servidor. |
| 8 | Registro, historial y seguimiento | ⏳ Esquema listo (cuentas, guardado, borrado de datos). Falta la UI: Supabase Auth, Mi recorrido, favoritos. |

### Antes de las pruebas controladas (20–30 estudiantes)

- Clave de OpenAI y 10–15 corridas internas para calibrar.
- Catálogo: completar al menos título y duración de las carreras que más aparecen.
- Encuesta breve al final del informe (identificación, descubrimiento, utilidad, confianza).
- Métricas: finalización, tiempo, abandono por pregunta.
- Rate limiting en `/api/assessment/*`.
- Deploy en Vercel con acceso restringido (no indexado, link privado).
- Consentimiento informado para la prueba: qué se hace con los datos, uso de IA, y aviso a un adulto responsable en menores. Para una prueba controlada se diseña con criterio prudente; la validación legal llega en el hito obligatorio previo al lanzamiento.

### Hito obligatorio antes del lanzamiento público

**Revisión legal con asesoramiento especializado en Argentina.** Debe cubrir:

- Ley 25.326 y normativa complementaria.
- Consentimiento según edad.
- Intervención de responsables parentales cuando corresponda.
- Protección de datos de menores.
- Uso de inteligencia artificial.
- Transferencias internacionales de datos (OpenAI, Supabase, Vercel).
- Política de privacidad y términos y condiciones.
- Derechos de acceso, rectificación y eliminación.

No se asumen requisitos legales definitivos sin ese asesoramiento.

### Posibilidad futura (no requisito)

Revisión de la metodología por un psicólogo especializado en orientación vocacional.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Que la herramienta se lea como diagnóstico o test científico | Alto | Avisos en landing, onboarding e informe; niveles cualitativos; prompts con alcance explícito |
| Datos académicos desactualizados o incompletos | Alto | Fuente y fecha por dato, pendientes visibles, revisión periódica |
| Datos de menores | Alto | Minimización, visitantes sin persistencia, nada identificable hacia la IA, RLS, borrado; revisión legal antes del lanzamiento |
| IA que inventa carreras o datos | Alto | IDs como `enum` en el esquema; datos institucionales agregados desde el catálogo; tests |
| Calidad de las preguntas generadas | Medio | Validación estricta, tope de 8, respaldo del banco; revisar transcripts del piloto |
| Sesgos (género, nivel socioeconómico) | Medio | Contexto nunca descarta; prompts sin estereotipos; métricas por segmento en el piloto |
| Latencia del informe (3 llamadas, una con razonamiento) | Medio | Pantalla de análisis por etapas; modelo rápido para tareas simples; medir y ajustar esfuerzo |
| Costo de IA | Bajo | ~US$0,10–0,20 por evaluación (estimado); rate limiting |
| Sitios oficiales que bloquean el relevamiento automático | Medio | Relevamiento manual (UNSAM, UNLaM) |
| Catálogo sesgado a las instituciones cargadas | Medio | Segunda tanda de 10 instituciones; mostrar qué falta |

## Decisiones abiertas (te consulto cuando lleguemos)

- Proveedor de login para el hito 8 (link mágico por mail vs. Google) y si pedimos mail a menores.
- Cómo se recluta el piloto (colegios o contactos), porque cambia el diseño del consentimiento.
- Fotografía: producción propia o banco con licencia.
