# Modelo de datos (v0.2)

SQL: `supabase/migrations/0001_init.sql` y `0002_catalog_ai.sql`; datos del catálogo: `supabase/seed/catalog.sql` (generado). RLS activado en todas las tablas. Migraciones y seed probados contra PostgreSQL 16 con un esquema `auth` simulado, incluidas las políticas RLS.

## Tres zonas

```
EVALUACIÓN (privada, por usuario)      CATÁLOGO (público, solo verificado)        METODOLOGÍA (versionada)
users                                   sources ◄────────────────┐                methodology_versions
 └─ assessments ── onboarding (jsonb)   institutions ── campuses  │                 └─ question_versions
     ├─ responses (item + versión)       │                        │                      └─ questions
     ├─ profiles                         programs ◄── careers ── career_attributes   study_fields (perfiles)
     │   └─ profile_dimensions           │  ├─ program_campuses (sede + modalidad)
     └─ recommendations                  │  └─ study_plans (materias)
         └─ recommendation_reasons       └─ todo con source_id + status + verified_at
saved_careers · comparisons
```

## Decisiones clave

**Carrera ≠ oferta.** `careers` es la carrera conceptual ("Licenciatura en Psicología"); `programs` es esa carrera en una institución concreta, con su nombre oficial, título, duración, ingreso y aranceles. Una carrera se vincula con muchas instituciones; cada `program` se dicta en una o varias sedes (`program_campuses`) y la modalidad puede variar por sede. Así no asumimos que todas las sedes dictan todo.

**Todo dato académico tiene fuente.** `programs.source_id` es obligatorio; instituciones, sedes y planes también apuntan a `sources` (URL, editor, fecha de consulta). `status` (`pendiente`/`verificado`/`desactualizado`/`descartado`) + `verified_at`. RLS solo expone filas `verificado` al público.

**Duración tal como se publica.** `duration_text` guarda el texto oficial; `duration_years` es un número derivado para filtrar. Aranceles en texto con fecha, porque cambian seguido.

**Metodología versionada.** Cada `assessment` guarda `methodology_version`; cada `response` guarda `question_id` + `question_version`. Si se cambia el texto o los pesos de una pregunta, se crea una versión nueva y las evaluaciones viejas siguen siendo interpretables. Las preguntas generadas por IA guardan su texto exacto en `generated_definition`.

**Trazabilidad de recomendaciones.** `recommendation_reasons.type` ∈ razón · respaldo · no_encaja · falta_explorar · relacionada. Los respaldos referencian la pregunta que los originó. `recommendations.level` es cualitativo; no se guarda ni muestra porcentaje.

**Unidades académicas.** `academic_units` (facultad, facultad regional, escuela, departamento, instituto, o "área"/"listado" cuando el sitio no habla de facultades) y `program_units` (N:M: una oferta puede figurar en dos facultades).

**Campos de estudio vs. carreras.** `study_fields` (39) son perfiles de facetas que usa el motor para preseleccionar. Cada oferta se clasifica en uno o más campos (`programs.field_ids`) y cada carrera hereda los de sus ofertas (`careers.field_ids`). Es clasificación editorial, no dato institucional. `careers.career_key` agrupa ofertas equivalentes entre instituciones.

**Trazabilidad de IA.** `assessments.engine` guarda modo (IA o reglas), modelos y versiones de prompt de cada llamada; `assessments.catalog_version` la versión del catálogo; `profiles.exploratory` el perfil interpretado por IA; `recommendations.why` la explicación.

**Eliminación.** `delete_my_data()` (security definer, solo `authenticated`) borra en cascada todo lo del usuario.

**Datos mínimos del usuario.** Sin nombre, DNI ni fecha de nacimiento: rango de edad, año escolar, zona aproximada, versión de consentimiento aceptada. El mail vive solo en `auth.users` (Supabase Auth).

**Retención.** `assessments.expires_at` + job programado (comentado en la migración) para purgar. El plazo final se confirma en la revisión legal previa al lanzamiento.

## Roles

`estudiante` (default), `editor` (catálogo y preguntas), `admin`. La función `has_role()` es `security definer` y las políticas de escritura del catálogo la usan. Un usuario no puede auto-asignarse rol (la política de `users` fuerza `role = 'estudiante'`).

## Entidades del brief

Todas incluidas: users, assessments, questions, question_versions, responses, profiles, profile_dimensions, careers, career_attributes, institutions, campuses, programs, study_plans, recommendations, recommendation_reasons, saved_careers, comparisons. Agregadas: `sources`, `methodology_versions`, `catalog_versions`, `study_fields`, `academic_units`, `program_units`, `program_campuses`.
