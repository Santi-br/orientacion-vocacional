# PROJECT — Arquitectura del producto

> Nombre provisorio. Estado: MVP v0.1 (validación con 20–30 estudiantes de CABA y GBA).

## 1. Qué estamos construyendo

Una plataforma de exploración vocacional para jóvenes de 15 a 18 años. El diferencial es un test **adaptativo y explicable**: cada persona hace un recorrido distinto, el test termina cuando hay información suficiente (no a la pregunta N) y cada recomendación muestra sus razones, las respuestas que la respaldan, lo que podría no encajar y lo que falta explorar.

Principio rector: **la IA es el núcleo (interpreta, pregunta, recomienda y explica); las reglas dan la base trazable y el respaldo; los datos académicos vienen solo del catálogo verificado.** Detalle de IA en `AI_ARCHITECTURE.md`.

## 2. Módulos

```
                     ┌───────────────────────────────────────────────┐
  Navegador          │ Landing · Onboarding · Test · Informe (+PDF)   │
  (sessionStorage)   │ estado: onboarding + respuestas + traza de IA   │
                     └──────────────┬────────────────────────────────┘
                                    │ POST (estado completo, validado con Zod)
                     ┌──────────────▼────────────────────────────────┐
  Servidor           │ /api/assessment/next        /api/assessment/report
  (Next.js)          │   reglas: cobertura,          pipeline A.2 → C → D
                     │   profundización, cierre       │
                     │   + IA en puntos de control    │
                     │  ┌─────────────────────────────▼─────────────┐
                     │  │ server/ai  (Groq gratis · JSON estricto)   │
                     │  │ A perfil · B preguntas · C carreras · D informe
                     │  └─────────────────────────────▲─────────────┘
                     │  candidatas + datos institucionales │
                     │  ┌─────────────────────────────┴─────────────┐
                     │  │ domain/catalog (JSON verificado, 11 inst.) │
                     │  └───────────────────────────────────────────┘
                     └──────────────┬────────────────────────────────┘
                                    │ (hito 8: cuenta + consentimiento)
                     ┌──────────────▼────────────────────────────────┐
  Supabase           │ Postgres + RLS · Auth · catálogo · evaluaciones │
                     └───────────────────────────────────────────────┘
```

| Módulo | Reglas (`src/domain`) | IA (`src/server/ai`) |
|---|---|---|
| A. Profile Analyzer | `methodology/profile.ts`: facetas con evidencia, cobertura, tensiones | `profile-analyzer.ts`: abiertas → señales; perfil exploratorio |
| B. Adaptive Question Engine | `methodology/engine.ts`: apertura, cobertura, profundización, pasatiempo/vocación, cierre | `question-planner.ts`: elige del banco o formula una pregunta nueva |
| C. Career Matching Engine | `matching/match.ts`: afinidad por campo, candidatas, respaldo, datos prácticos | `career-matcher.ts`: elige y explica entre candidatas del catálogo |
| D. Report Generator | `report/build-report.ts`: informe base | `report-writer.ts`: síntesis y próximos pasos |

El dominio es TypeScript puro, sin dependencias de framework: se testea con Vitest. La IA se prueba con un modelo falso inyectado.

## 3. Estructura de carpetas

```
docs/                      Documentación de producto y decisiones
data/catalog/institutions/ Catálogo verificado: una ficha JSON por institución
supabase/migrations/       Esquema SQL + RLS
src/
  app/                     Rutas (App Router de Next.js 16)
    page.tsx               Landing
    explorar/              Onboarding → test → informe
    privacidad/            Política (borrador)
    api/assessment/        next · report (motor sin estado)
  components/ui/           Sistema de diseño: Horizon, Button, Wordmark
  components/landing/      Piezas de la landing
  features/assessment/     Cliente del test: onboarding, runner, preguntas, sesión
  features/report/         Informe interactivo + PDF (impresión)
  domain/                  Lógica pura y testeable
    methodology/           Dimensiones, facetas, banco, pasatiempo/vocación, perfil, motor, schemas
    matching/              Afinidad, candidatas, recomendaciones de respaldo, datos prácticos
    catalog/               Catálogo verificado (carga + clasificación editorial) y campos de estudio
    report/                Tipos del informe, resumen de respuestas, informe base
  server/                  Solo servidor ("server-only")
    ai/                    llm (Groq/compatible) · prompts versionados · A · B · C · D · pipeline
    repositories/          Persistencia en Supabase (hito 8)
    env.ts · supabase.ts
scripts/catalog-to-sql.ts  JSON del catálogo → supabase/seed/catalog.sql
```

## 4. Flujo de navegación

```
Landing ──► /explorar (onboarding, 4 pasos)
              1 edad + año   2 zona   3 áreas en mente (opcional)   4 privacidad + consentimiento IA
        ──► /explorar/test   (pregunta a pregunta; Volver / Saltear; el horizonte se ilumina con la cobertura)
        ──► /explorar/informe (transición de análisis → informe → PDF / volver a explorar)

Hito 8:   informe ──► crear cuenta (opcional) ──► Mi recorrido (historial, favoritos)
                  └─► ficha de carrera ──► instituciones/sedes ──► comparador
Después:  /admin (catálogo, preguntas, fuentes) · analytics
```

Decisiones del brief respetadas: se empieza sin cuenta, se completa y se ve el informe como visitante, el informe está en la web y se descarga en PDF, se puede volver a explorar.

## 5. Flujo de datos y privacidad por diseño

- El estado del visitante vive en `sessionStorage` (se borra al cerrar la pestaña).
- El servidor es **sin estado** para visitantes: recibe el estado completo, lo valida con Zod, responde y no guarda nada.
- La IA (solo con consentimiento) recibe preguntas y respuestas y señales calculadas. Nunca edad, año escolar, zona ni identificadores; `store: false`.
- Las claves (`AI_API_KEY`, Supabase) solo existen en el servidor. No hay variables `NEXT_PUBLIC_` con secretos.
- Persistencia (hito 8): solo con cuenta, con RLS en todas las tablas; la app usa la anon key + sesión del usuario, nunca `service_role`.

Detalle en `PRIVACY.md`.

## 6. Stack

Se mantuvo el stack propuesto. Notas:

- **Next.js 16** (App Router). `middleware` pasó a llamarse `proxy`; `params` y `cookies()` son asíncronos.
- **Tailwind 4** con tokens en `@theme` (`globals.css`).
- **Zod 4** para validar todo lo que entra del cliente y todo lo que devuelve la IA.
- **IA**: Groq (plan gratis) vía API compatible con OpenAI, con salidas JSON estrictas. `src/server/ai/llm.ts` es la única puerta al proveedor. Proveedor y modelos por variable de entorno. Sin clave, la app funciona entera con reglas.
- Fuentes autoalojadas vía `@fontsource` (Manrope + Instrument Serif): sin llamadas a Google en runtime.

Ver `DECISIONS.md` para el razonamiento de cada elección, `ROADMAP.md` para hitos y riesgos, `ACADEMIC_CATALOG.md` para el catálogo y `RECOMMENDATIONS.md` para el motor de recomendaciones.
