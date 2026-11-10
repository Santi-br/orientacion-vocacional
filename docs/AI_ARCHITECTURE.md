# Arquitectura de IA

La IA es el núcleo de la experiencia: interpreta respuestas, decide preguntas, construye el perfil, elige carreras y redacta el informe. Las reglas determinísticas quedan como **base trazable** y **respaldo**: si la IA no está configurada, la persona no dio consentimiento o una llamada falla, el producto sigue funcionando y lo dice.

## Proveedor y modelos: costo cero

Decisión del 10/11/2026: **no pagar por la IA**. OpenAI no tiene plan gratis (la ficha de `gpt-6.1-sol` dice "Free: not supported"), así que se usa **Groq**, que tiene plan gratis y una API compatible con la de OpenAI.

| Opción gratis | Datos | Salida estructurada | Decisión |
|---|---|---|---|
| **Groq (plan gratis)** | No retiene datos de inferencia por defecto; retención cero activable por cualquier cliente ([Your data](https://console.groq.com/docs/your-data)) | `json_schema` estricto en `gpt-oss-20b`, `gpt-oss-120b` y `qwen3.8-27b` ([Structured outputs](https://console.groq.com/docs/structured-outputs)) | **Elegida** |
| Gemini API (plan gratis) | El plan gratis indica "Content used to improve our products" ([precios](https://aistudio.google.com/docs/pricing)) | Sí | Descartada: no es aceptable con respuestas de menores |
| Modelos locales (Ollama, etc.) | No salen de la máquina | Varía | Descartada para el MVP: necesitan una computadora encendida y potente; no corren en Vercel |

### Modelos en Groq

| Tarea | Modelo | Por qué |
|---|---|---|
| A.2 perfil exploratorio · C recomendaciones | `openai/gpt-oss-120b` (esfuerzo `medium`) | El más capaz del plan gratis con salida estricta |
| A.1 respuestas abiertas · D textos del informe | `openai/gpt-oss-20b` (esfuerzo `low`) | Rápido, tareas acotadas |
| B preguntas adaptativas | `qwen/qwen3.8-27b` (esfuerzo `low`) | Usa una cuota distinta; es la tarea que más se repite |

**Cuota gratuita** (tabla de [rate limits](https://console.groq.com/docs/rate-limits), por modelo): 30 pedidos/min, 1.000 pedidos/día, 8.000 tokens/min y 200.000 tokens/día. Groq aclara que los valores exactos de cada cuenta se ven en *Settings → Limits*.

Cómo se cuida la cuota:
- Las tareas se reparten entre tres modelos, cada uno con su propia cuota.
- El planificador consulta a la IA cada 4 respuestas o después de una abierta, con un máximo de 6 preguntas generadas, y recibe solo 10 candidatas y las últimas preguntas.
- El motor de recomendaciones recibe 40 carreras candidatas.
- Ante un límite por minuto (HTTP 429), espera lo que indique Groq (máximo 20 s) y reintenta una vez.
- Si la cuota del día se agota, el test y el informe siguen funcionando con reglas y el informe lo indica.

Estimación (a medir con la cuenta real): **unas 15–25 evaluaciones completas por día** sin costo. Alcanza para pruebas con 20–30 estudiantes organizadas en tandas.

**Configuración** (`.env.local`):

```
AI_API_KEY=            # clave gratis de console.groq.com
# Opcionales:
AI_PROVIDER=groq       # o openai, si algún día se paga
AI_MODEL_REASONING=openai/gpt-oss-120b
AI_MODEL_FAST=openai/gpt-oss-20b
AI_MODEL_PLANNER=qwen/qwen3.8-27b
```

Pasos para la cuenta: crear la clave en console.groq.com y activar **Zero Data Retention** en *Settings → Data Controls*.

Pasar a un proveedor pago (por ejemplo, OpenAI con `gpt-6.1-sol`) es cambiar `AI_PROVIDER` y la clave: el código no cambia.

## Los cuatro módulos

```
 durante el test                                  al terminar
 ───────────────                                  ───────────
 respuesta abierta ─► A.1 open_answer_analysis    A.2 profile_synthesis  ── perfil exploratorio
                      (gpt-oss-20b)                     (gpt-oss-120b)          │
                                                                                ▼
 cada 4 respuestas ─► B  question_planner          C  career_matching  ◄── candidatas del
 o tras una abierta    (qwen3.8-27b) banco o            (gpt-oss-120b)       catálogo verificado
                       pregunta nueva validada          │
                                                        ▼
                                                   D  report_writer (gpt-oss-20b) ── síntesis y cierre
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

- **No inventa datos académicos.** C recibe solo carreras del catálogo y el esquema de salida (JSON Schema estricto) declara sus IDs como `enum`: un ID inexistente no pasa la validación. Instituciones, nombres oficiales, unidades académicas y fuentes se agregan *después*, desde el catálogo. Las "actividades" son orientativas y el prompt prohíbe nombrar materias, años o datos de instituciones; la UI lo aclara.
- **Evidencia trazable.** Los respaldos referencian IDs de respuestas reales (también `enum`).
- **Salidas estructuradas estrictas.** `response_format: json_schema` con `strict: true`, generado desde los esquemas Zod; además se valida con Zod y se acota en código (largos, cantidades, pesos).
- **Preguntas generadas seguras.** Se descartan si tienen menos de 3 opciones, si son abiertas sin consentimiento o si no traen señales válidas. Tope de 6 por evaluación.
- **El texto del estudiante es dato.** Va delimitado y los prompts indican ignorar instrucciones dentro de él.
- **Sin encasillar.** Los prompts piden hablar de tendencias, tratar las contradicciones como pistas y mantener variedad en las recomendaciones.
- **Alcance honesto.** Todos los prompts recuerdan que no es un test psicométrico validado, ni un diagnóstico, ni reemplaza la orientación profesional.

## Trazabilidad de versiones

Cada llamada devuelve `{ task, model, promptVersion, ok }`. Las del test viajan con el estado del visitante; las del informe se suman; el informe final las incluye en `engine.trace` y, al guardar con cuenta, se persisten en `assessments.engine`. Junto con `methodology_version` y `catalog_version`, cada evaluación se puede reproducir y auditar.

Los prompts viven en `server/ai/prompts.ts` con `id` y `version`. Cambiar el texto de un prompt implica subir su versión.

## Datos que salen hacia el proveedor

Solo respuestas (texto de las preguntas + opción elegida o texto escrito) y señales calculadas. **Nunca** edad, año escolar, zona ni identificadores. Con retención cero activada en Groq. Sin consentimiento en el onboarding no hay ninguna llamada. Ver `PRIVACY.md`.

## Cómo probarlo

`src/server/ai/__tests__/ai.test.ts` usa un modelo falso para verificar que se rechazan carreras inventadas, se descartan preguntas mal formadas, se completan instituciones desde el catálogo, se registran modelo y versión de prompt, y que el informe cae a reglas si la IA falla. `src/test/schema-check.test.ts` verifica que los esquemas se conviertan a JSON Schema estricto.

Además, el flujo completo se probó a través del SDK real contra un servidor que imita la API de Groq: 11 llamadas por evaluación con el modelo, esfuerzo y esquema estricto correctos, 6 preguntas generadas respondidas, y recuperación ante un límite por minuto simulado.

**Pendiente:** correr el flujo con la clave gratis real y ajustar prompts con las primeras evaluaciones (ver hito 3 del roadmap). Los modelos abiertos pueden necesitar prompts más guiados que los de OpenAI.
