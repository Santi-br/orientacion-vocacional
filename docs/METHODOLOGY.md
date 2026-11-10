# Metodología del test — v0.2.0

> Herramienta de **exploración y orientación vocacional asistida por IA**. No es un test psicométrico validado, ni un diagnóstico psicológico, ni reemplaza una orientación profesional. Así se presenta en la landing, el onboarding y el informe.
>
> Decisión del 10/11/2026: la metodología inicial se desarrolla con IA, sin especialistas externos. Incorporar más adelante a un psicólogo especializado en orientación vocacional queda como posibilidad, no como requisito del MVP.

## Dimensiones y facetas

Ocho dimensiones: intereses, personalidad y preferencias, habilidades percibidas, motivaciones, valores, estilo de vida deseado, preferencias académicas, y contexto y posibilidades. Las siete primeras se descomponen en **48 facetas** (`src/domain/methodology/dimensions.ts`). "Contexto" no puntúa afinidad: solo ordena opciones.

Las facetas no son etiquetas: una persona puede puntuar alto en muchas. Sirven como lenguaje común entre las reglas y la IA.

## Cómo se arma el test

| Capa | Qué aporta |
|---|---|
| Banco versionado (~50 ítems) | 7 formatos: opción única, múltiple, escenario, escala de identificación, entre dos polos, abierta, contexto. Cada opción declara señales (±2) sobre facetas. |
| Profundización | Ítems que solo aparecen cuando un interés supera un umbral (p. ej. tecnología ≥ 0,35). |
| Pasatiempo o vocación | Para los dos intereses más fuertes: "¿lo disfrutás como pasatiempo o te imaginás trabajando de eso?". La respuesta ajusta el peso vocacional de ese interés. |
| Tensiones | Si una faceta tiene evidencia fuerte a favor y en contra, se buscan ítems que la aclaren. |
| **IA (planificador)** | Cada 3 respuestas, y después de cada abierta, decide si conviene una pregunta del banco o **formular una nueva** (opción única, escenario, escala o abierta) para profundizar, aclarar una contradicción o explorar un interés no considerado. |
| **IA (análisis de abiertas)** | Convierte texto libre en señales sobre facetas, temas y pistas de pasatiempo. |

**Duración variable.** El test termina cuando hay al menos 18 respuestas, todas las dimensiones alcanzaron su cobertura mínima, se profundizó en los intereses principales, se preguntó por pasatiempo o vocación, no quedan tensiones aclarables y (con IA) hay al menos 2 respuestas abiertas. Tope: 40.

## Perfil

1. **Por reglas** (trazable): por faceta, `score = tanh(Σ evidencia / 3)` en −1..1 y `confianza = n / (n + 2)`. Cada evidencia guarda qué respuesta la aportó.
2. **Por IA** (interpretativo): intereses principales y secundarios, combinaciones, pasatiempos, tensiones y qué falta explorar, cada punto con las respuestas que lo respaldan.

## Recomendaciones

Ver `RECOMMENDATIONS.md`. Resumen: la IA elige y explica carreras **solo entre las del catálogo verificado**, con niveles cualitativos de afinidad.

## Principios que la IA debe respetar (en los prompts)

- Hablar de tendencias, no de identidades. No encasillar.
- Las contradicciones son pistas, no errores.
- No inducir respuestas; opciones equilibradas.
- No repetir ni parafrasear preguntas ya hechas.
- No inventar información académica.
- Recordar el alcance: exploración, no diagnóstico.

## Versionado

- `METHODOLOGY_VERSION` (hoy `0.2.0`) se guarda en cada evaluación.
- Cada ítem del banco tiene `version`; las preguntas generadas viajan con su definición completa.
- Cada prompt tiene `id` y `version`; cada evaluación registra modelo y versión de prompt de cada llamada.

## Mejoras posibles a futuro (no bloquean el MVP)

- Revisión por un profesional de orientación vocacional.
- Ajustar pesos y perfiles de campos con datos del piloto (identificación con resultados, descubrimientos).
- Revisar sesgos de género y socioeconómicos en ítems y recomendaciones con métricas por segmento.
