# Motor de recomendaciones

## Qué hace

Relaciona el perfil de cada estudiante con **carreras reales del catálogo verificado** y explica cada relación. No suma puntos para devolver cinco carreras fijas: la IA razona sobre el perfil completo y puede encontrar conexiones no obvias, pero solo entre carreras que existen.

## Las cuatro miradas

| Criterio | Cómo se aplica |
|---|---|
| Afinidad personal | Intereses, modos de trabajo, motivaciones, valores y estilo de vida (perfil + respuestas). |
| Afinidad académica | Habilidades percibidas y preferencias de estudio (teoría/práctica, matemática, duración). |
| Compatibilidad práctica | Contexto (pública/privada, zona, trabajo, modalidad). **Ordena y marca, nunca descarta.** Hoy se marca "coincide con tu preferencia" por sector y "tiene sede en tu zona" cuando las sedes están verificadas. |
| Descubrimiento | 1 a 3 carreras fuera de los intereses más obvios, conectadas por forma de trabajo o motivación. |

## Flujo

1. **Perfil por reglas** (`domain/methodology/profile.ts`): facetas con evidencia trazable.
2. **Afinidad por campo** (`domain/matching/match.ts`): 39 campos de estudio con perfiles de facetas; afinidad combinada = 0,65 personal + 0,35 académica.
3. **Carreras candidatas**: las ~55 carreras del catálogo más afines, más la mejor de cada campo que haya quedado afuera, para habilitar descubrimientos. Las carreras "puente" (varios campos afines) suman un poco.
4. **IA (Sol)**: elige 4–6 principales y 1–3 descubrimientos y explica cada una.
5. **Catálogo**: se agregan instituciones, nombres oficiales, unidades académicas, fuentes y fechas.

Sin IA, el paso 4 lo hace `deterministicRecommendations`: las mejor puntuadas con máximo 2 por campo, y descubrimientos con reglas.

## Qué explica cada carrera

- Por qué se recomienda.
- Qué respuestas la respaldan (con la pregunta y lo que respondió).
- Qué intereses y preferencias coinciden.
- Qué actividades o temas podrían atraerle (orientativo, no son materias de un plan).
- Qué podría no encajar.
- Qué conviene averiguar.
- Carreras relacionadas.
- Dónde estudiarla: institución, sector, nombre oficial de la oferta, unidad académica, fuente oficial y fecha; qué datos siguen pendientes.

## Niveles de afinidad

Cualitativos, nunca porcentajes. El significado se muestra en el informe:

| Nivel | Significado |
|---|---|
| Afinidad muy marcada | Muchas respuestas, de distintas dimensiones, apuntan hacia acá. |
| Afinidad clara | Varias respuestas se relacionan, aunque no todas. |
| Afinidad posible | Hay puntos en común, pero también cosas que no sabemos o no encajan. |
| Para explorar | Una conexión menos obvia que vale la pena mirar con curiosidad. |

## Qué es editorial y qué es dato

- **Dato institucional** (con fuente): institución, unidad académica, nombre oficial de la oferta, sedes de la institución, orientaciones y fechas de inicio cuando la fuente las publica.
- **Editorial de PROJECT** (`domain/catalog/classify.ts`): tipo de formación inferido del nombre, campos de estudio asociados y agrupación de ofertas equivalentes en una "carrera" (p. ej. "Licenciatura en Psicología" y "PSICOLOGÍA" se agrupan como *Psicología*). Los ciclos de complementación se excluyen porque requieren un título previo.

## Límites actuales

- Las carreras de UNSAM y UNLaM todavía no están cargadas (ver `ACADEMIC_CATALOG.md`), así que no pueden recomendarse.
- La compatibilidad práctica es parcial: faltan sedes por carrera, modalidad, duración y aranceles.
- Los perfiles de los campos de estudio son criterios de trabajo del equipo, no parámetros validados.
