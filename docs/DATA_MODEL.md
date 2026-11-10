# Modelo de datos (v0.1)

SQL completo: `supabase/migrations/0001_init.sql`. RLS activado en todas las tablas.

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

**Campos de estudio vs. carreras.** `study_fields` son áreas metodológicas (perfil de facetas) que usa el motor hoy. Cuando haya catálogo, cada carrera se asocia a un campo (`careers.field_id`) y puede refinar su perfil con `career_attributes`.

**Datos mínimos del usuario.** Sin nombre, DNI ni fecha de nacimiento: rango de edad, año escolar, zona aproximada, versión de consentimiento aceptada. El mail vive solo en `auth.users` (Supabase Auth).

**Retención.** `assessments.expires_at` + job programado (comentado en la migración) para purgar. El plazo final se define con asesoría legal.

## Roles

`estudiante` (default), `editor` (catálogo y preguntas), `admin`. La función `has_role()` es `security definer` y las políticas de escritura del catálogo la usan. Un usuario no puede auto-asignarse rol (la política de `users` fuerza `role = 'estudiante'`).

## Entidades del brief

Todas incluidas: users, assessments, questions, question_versions, responses, profiles, profile_dimensions, careers, career_attributes, institutions, campuses, programs, study_plans, recommendations, recommendation_reasons, saved_careers, comparisons. Agregadas: `sources`, `methodology_versions`, `study_fields`, `program_campuses`.
