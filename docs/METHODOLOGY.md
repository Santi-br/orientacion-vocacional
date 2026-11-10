# Metodología del test — v0.1.0-draft

> **No es un instrumento validado.** Es un borrador de trabajo del equipo de producto para poder construir y probar el sistema. Antes del piloto con estudiantes debe revisarse con profesionales de orientación vocacional y psicometría. No se presenta como diagnóstico ni como test científico.

## Dimensiones y facetas

8 dimensiones (las del brief). Las 7 primeras se descomponen en **48 facetas** (`src/domain/methodology/dimensions.ts`); "contexto" no puntúa afinidad, solo describe el punto de partida.

Las facetas no son etiquetas: cada una tiene su propio puntaje y una persona puede puntuar alto en muchas.

## Ítems

Banco v1: ~50 ítems (`question-bank.ts`) en 7 formatos: opción única, múltiple, situación cotidiana/escenario, escala de identificación (1–5), entre dos polos, abierta y contexto. Cada opción declara **señales**: pesos −2..+2 sobre facetas. No elegir una opción no es evidencia negativa.

Tipos de ítem:
- **opening** (3): iguales para todos, amplios.
- **core**: cubren dimensiones.
- **deep**: solo aparecen si un interés ya superó un umbral (p. ej. tecnología ≥ 0,35). Es lo que hace que cada recorrido sea distinto.
- **probe**: aclaran facetas con señales contradictorias.

## Perfil

Por faceta: `score = tanh(Σ evidencia / 3)` en −1..1, `confianza = n / (n + 2)`. Se guarda cada evidencia (ítem, peso, respuesta) para poder explicar resultados. Una faceta tiene **tensión** si tiene evidencia ≥ +0,75 y ≤ −0,75: se interpreta como "depende del contexto", no como error.

## Motor adaptativo

1. Apertura fija.
2. Puntúa candidatos: necesidad de cobertura de su dimensión, profundización en los 3 intereses más altos, aclaración de tensiones, variedad (penaliza repetir dimensión o formato), contexto hacia el final, abiertas no consecutivas.
3. Con IA: cada 7 respuestas (máx. 2) formula una pregunta abierta sobre los 2 intereses dominantes, sin mencionar carreras ni inducir.
4. **Termina** cuando: ≥ 18 respuestas, todas las dimensiones alcanzaron su cobertura mínima, se profundizó en los 2 intereses principales, no quedan tensiones con ítem disponible para aclararlas y (con IA) hay ≥ 2 abiertas. Tope: 42.

En simulaciones, perfiles distintos recorren entre ~25 y ~32 preguntas con caminos diferentes.

## Afinidad

- Personal: intereses, modos de trabajo, motivaciones, valores, estilo de vida.
- Académica: habilidades percibidas y preferencias de estudio.
- Combinada = 0,65 · personal + 0,35 · académica. Se informa en 4 niveles cualitativos (muy marcada, clara, posible, para explorar). **Nunca porcentajes.**
- Descubrimiento: áreas fuera del top cuyo interés dominante no fue marcado ni aparece entre los intereses principales, pero que coinciden en ≥ 2 facetas de forma de trabajo o motivación.
- Práctica: pendiente de catálogo; el contexto nunca descarta opciones.

## Para revisar con profesionales

- Taxonomía de facetas y su relación con marcos existentes (p. ej. modelos de intereses tipo RIASEC), sin presentarlo como equivalente.
- Redacción de ítems: sesgos de género y socioeconómicos, lectura para 15 años, deseabilidad social.
- Pesos de ítems y perfiles de áreas (`study-fields.draft.ts`).
- Reglas de cierre y umbrales.
- Cómo comunicar resultados a menores.
- Protocolo ante respuestas que sugieran malestar (hoy: aviso con líneas de ayuda).
