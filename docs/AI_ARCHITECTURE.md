# Arquitectura de IA

La IA es el núcleo de la experiencia: interpreta respuestas, decide preguntas, construye el perfil, elige carreras y redacta el informe. Las reglas determinísticas quedan como **base trazable** y **respaldo**: si la IA no está configurada, la persona no dio consentimiento o una llamada falla, el producto sigue funcionando y lo dice.

## Modelos (elegidos el 10/11/2026)

Consultado en [developers.openai.com/api/docs/models](https://developers.openai.com/api/docs/models) y las fichas de cada modelo.

| Modelo | Posicionamiento oficial | Precio por 1M tokens (entrada / salida) | Structured Outputs | Uso en PROJECT |
|---|---|---|---|---|
| `gpt-6-astra` | El más capaz, para el trabajo más exigente | US$10 / US$50 | — | No usado: costo 5× Sol sin necesidad para esta tarea |
| **`gpt-6.1-sol`** | "Near-Astra performance for complex work at a lower cost" | US$2 / US$10 | Sí | **Modelo de razonamiento**: perfil (A.2) y recomendaciones (C) |
| `gpt-6.1-terra` | Rápido, visión, escritura natural | US$1 / US$5 | — | Alternativa para D si la redacción de Luna no alcanza |
| **`gpt-6-luna`** | "Most efficient model for focused, high-volume tasks" | US$0,10 / US$0,50 | Sí | **Modelo rápido**: respuestas abiertas (A.1), planificador de preguntas (B), textos del informe (D) |

Los cuatro tienen ventana de 1,05M tokens y razonamiento configurable (`reasoning.effort`, default `medium`).

**Por qué dos modelos.** El planificador corre varias veces durante el test y tiene que responder en pocos segundos; Luna con esfuerzo `low` alcanza. La elección de carreras es la tarea que más razonamiento pide (relacionar intereses con carreras de forma no obvia), y se hace una sola vez por informe: ahí conviene Sol con esfuerzo `medium`.

**Costo estimado** (a medir en el piloto): un informe ≈ 15–20k tokens en Sol (entrada + salida + razonamiento) más 8–10 llamadas cortas a Luna, del orden de **US$0,10–0,20 por evaluación completa**.

**Configurable sin tocar código** (`.env.local`):

```
OPENAI_API_KEY=
OPENAI_MODEL_REASONING=gpt-6.1-sol
OPENAI_MODEL_FAST=gpt-6-luna
OPENAI_EFFORT_REASONING=medium
OPENAI_EFFORT_FAST=low
```

## Los cuatro módulos

```
 durante el test                                  al terminar
 ───────────────                                  ───────────
 respuesta abierta ─► A.1 open_answer_analysis    A.2 profile_synthesis  ── perfil exploratorio
                      (Luna) señales + temas            (Sol)                   │
                                                                                ▼
 cada 3 respuestas ─► B  question_planner          C  career_matching  ◄── candidatas del
 o tras una abierta    (Luna) banco o pregunta          (Sol)                catálogo verificado
                       nueva validada                   │
                                                        ▼
                                                   D  report_writer (Luna) ── síntesis y cierre
```

| Módulo | Archivo | Entrada | Salida (validada) | Respaldo |
|---|---|---|---|---|
| A.1 Análisis de abiertas | `server/ai/profile-analyzer.ts` | pregunta + texto | señales sobre facetas conocidas (máx. 5, ±1,5), temas, pista de pasatiempo, alerta de bienestar | la abierta no suma evidencia |
| A.2 Perfil exploratorio | `server/ai/profile-analyzer.ts` | resumen de respuestas + señales | intereses principales y secundarios, combinaciones, pasatiempos, tensiones, qué falta explorar, cada uno con IDs de respuestas | perfil por reglas |
| B Preguntas adaptativas | `server/ai/question-planner.ts` | dimensiones faltantes, intereses, últimas respuestas, preguntas ya hechas, banco disponible | elegir un ítem del banco **o** formular uno nuevo (opción única, escenario, escala o abierta) con señales por opción | ítem mejor puntuado por reglas |
| C Recomendaciones | `server/ai/career-matcher.ts` | perfil + respuestas + ~55 carreras candidatas del catálogo | 4–6 principales y 1–3 descubrimientos, con nivel, por qué, respaldo, actividades, qué no encaja, qué falta saber y relacionadas | recomendaciones por reglas |
| D Informe | `server/ai/report-writer.ts` | perfil + carreras elegidas | síntesis y próximos pasos | sin síntesis redactada |

`server/ai/pipeline.ts` orquesta A.2 → C → D.

## Garantías

- **No inventa datos académicos.** C recibe solo carreras del catálogo y el esquema de salida declara sus IDs como `enum`: un ID inexistente no pasa la validación. Instituciones, nombres oficiales, unidades académicas y fuentes se agregan *después*, desde el catálogo. Las "actividades" son orientativas y el prompt prohíbe nombrar materias, años o datos de instituciones; la UI lo aclara.
- **Evidencia trazable.** Los respaldos referencian IDs de respuestas reales (también `enum`).
- **Salidas estructuradas estrictas.** Responses API + `zodTextFormat` (strict). Todo se vuelve a acotar en código (largos, cantidades, pesos).
- **Preguntas generadas seguras.** Se descartan si tienen menos de 3 opciones, si son abiertas sin consentimiento o si no traen señales válidas. Tope de 8 por evaluación.
- **El texto del estudiante es dato.** Va delimitado y los prompts indican ignorar instrucciones dentro de él.
- **Sin encasillar.** Los prompts piden hablar de tendencias, tratar las contradicciones como pistas y mantener variedad en las recomendaciones.
- **Alcance honesto.** Todos los prompts recuerdan que no es un test psicométrico validado, ni un diagnóstico, ni reemplaza la orientación profesional.

## Trazabilidad de versiones

Cada llamada devuelve `{ task, model, promptVersion, ok }`. Las del test viajan con el estado del visitante; las del informe se suman; el informe final las incluye en `engine.trace` y, al guardar con cuenta, se persisten en `assessments.engine`. Junto con `methodology_version` y `catalog_version`, cada evaluación se puede reproducir y auditar.

Los prompts viven en `server/ai/prompts.ts` con `id` y `version`. Cambiar el texto de un prompt implica subir su versión.

## Datos que salen hacia OpenAI

Solo respuestas (texto de las preguntas + opción elegida o texto escrito) y señales calculadas. **Nunca** edad, año escolar, zona ni identificadores. Se envía `store: false`. Sin consentimiento en el onboarding no hay ninguna llamada. Ver `PRIVACY.md`.

## Cómo probarlo

`src/server/ai/__tests__/ai.test.ts` usa un modelo falso para verificar que se rechazan carreras inventadas, se descartan preguntas mal formadas, se completan instituciones desde el catálogo, se registran modelo y versión de prompt, y que el informe cae a reglas si la IA falla. `src/test/schema-check.test.ts` verifica que los esquemas se conviertan a JSON Schema estricto.

**Pendiente:** correr el flujo completo con una clave real y ajustar prompts con las primeras evaluaciones (ver hito 3 del roadmap).
