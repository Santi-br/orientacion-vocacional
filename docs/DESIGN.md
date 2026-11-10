# Sistema de diseño

Basado en las dos referencias del brief (pastilla de vidrio con serif itálica sobre un claro luminoso; tarjetas altas con foto en movimiento y capas de vidrio).

## Tokens (`src/app/globals.css`)

| Token | Hex | Uso |
|---|---|---|
| graphite | #202B32 | Fondo base (nunca negro puro) |
| petrol | #344650 | Secciones de profundidad |
| bluegrey | #526E78 | Superficies medias, numerales |
| sky | #9BCBD4 | Luz, foco, acentos |
| mint | #B8DCD4 | Selección, progreso, brillo del horizonte |
| frost | #E8EEF0 | Texto principal, sección clara |

Radios: tarjetas 28 px, paneles 20 px, controles 14 px, botones pastilla.

## Tipografía

- **Manrope** (variable): sistema, UI y titulares, peso 500, tracking −3,5 %.
- **Instrument Serif itálica**: tiene un rol fijo, el **registro personal**: las respuestas abiertas del estudiante, las frases en primera persona que tiene que valorar, lo que el sistema le devuelve sobre sí mismo (síntesis, respaldos). Si está en serif, es tuyo.

## El horizonte

Elemento firma (`components/ui/horizon.tsx`). En la landing es atmósfera; **durante el test es el indicador de progreso**: como el test no tiene cantidad fija de preguntas, en vez de "12 de 20" el horizonte se ilumina a medida que el sistema cubre las 8 dimensiones. En el informe está completamente encendido.

## Vidrio

`.glass` (translúcido con borde de luz) para paneles y chips; `.liquid` (pastilla clara con borde iridiscente) solo para la acción principal de cada pantalla. Usar con moderación: un panel de vidrio por bloque, no todo.

## Movimiento

Una entrada orquestada (`.rise`) por pantalla y transiciones que responden a acciones (selección, avance, horizonte). Se respeta `prefers-reduced-motion`.

## Fotografía (pendiente)

Hoy las escenas son composiciones CSS. Para la versión final: fotografía propia, cinematográfica, de adolescentes reales del AMBA en situaciones de exploración (talleres, laboratorios, calle, estudio), con movimiento y desenfoque, viradas a azul petróleo/turquesa. `Horizon` acepta `photo`; las tarjetas de la landing están preparadas para reemplazar el fondo. Con consentimiento de imagen y, para menores, de sus adultos responsables.
