# Catálogo académico — proceso de verificación

**Estado actual: vacío a propósito.** No se cargó ningún dato de instituciones ni carreras. `data/catalog/institutions.pending.json` solo lista las siglas provistas por el equipo, todas `pendiente`. El informe muestra "Todavía no cargamos instituciones verificadas" en cada área.

## Reglas

1. Un dato entra solo con **fuente oficial** (sitio de la institución, resolución ministerial, CONEAU, Ministerio de Educación) registrada en `sources` con URL y fecha.
2. Se carga como `pendiente`; un segundo editor lo pasa a `verificado`. Solo lo verificado es visible.
3. Cada oferta (`programs`) se vincula a las sedes donde **efectivamente** se dicta, con su modalidad. No se asume que todas las sedes dictan todo.
4. Duración y aranceles se guardan como los publica la institución, con fecha.
5. Revisión periódica: si una fuente cambia o pasan más de 12 meses, el dato pasa a `desactualizado`.
6. La IA puede ayudar a **extraer** datos de una página oficial para que un editor los revise; nunca los publica sola ni los inventa.

## Orden sugerido para el piloto

Para el piloto alcanza con profundidad, no amplitud: cubrir 8–10 instituciones de la lista (públicas y privadas, CABA y GBA) y, en cada una, las ofertas vinculadas a los ~30 campos de estudio. Después, terciarios y tecnicaturas (relevar fuentes oficiales de la jurisdicción CABA y de la Provincia de Buenos Aires).

## Ficha de carrera (campos del brief → tablas)

| Campo | Tabla.columna |
|---|---|
| Nombre oficial | programs.official_name |
| Área de conocimiento | careers.knowledge_area |
| Descripción, salidas profesionales | careers.description, careers.career_outcomes |
| Materias del plan | study_plans.subjects |
| Duración teórica | programs.duration_text / duration_years |
| Título otorgado | programs.degree_title |
| Orientaciones | programs.orientations |
| Instituciones, sedes, modalidad | programs → program_campuses → campuses |
| Requisitos de ingreso | programs.admission |
| Aranceles y becas | programs.fees_info, programs.scholarships |
| Fuente oficial, fecha de verificación | sources, *.verified_at |
