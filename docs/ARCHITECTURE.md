# PROJECT — Arquitectura del producto

> Nombre provisorio. Estado: MVP v0.1 (validación con 20–30 estudiantes de CABA y GBA).

## 1. Qué estamos construyendo

Una plataforma de exploración vocacional para jóvenes de 15 a 18 años. El diferencial es un test **adaptativo y explicable**: cada persona hace un recorrido distinto, el test termina cuando hay información suficiente (no a la pregunta N) y cada recomendación muestra sus razones, las respuestas que la respaldan, lo que podría no encajar y lo que falta explorar.

Principio rector: **la IA interpreta y redacta; las reglas deciden; los datos académicos vienen solo del catálogo verificado.**

## 2. Módulos

```
                     ┌───────────────────────────────────────────┐
  Navegador          │  Landing · Onboarding · Test · Informe    │
  (sessionStorage)   │  estado del visitante: onboarding+respuestas│
                     └──────────────┬────────────────────────────┘
                                    │ POST (estado completo, validado con Zod)
                     ┌──────────────▼────────────────────────────┐
  Servidor (Next.js) │ /api/assessment/next     /api/assessment/report
                     │        │                        │
                     │  ┌─────▼──────────┐   ┌─────────▼─────────┐
                     │  │ B. Adaptive    │   │ C. Career matching│
                     │  │ question engine│   │ D. Report builder │
                     │  └─────┬──────────┘   └─────────┬─────────┘
                     │  ┌─────▼────────────────────────▼─────────┐
                     │  │ A. Profile analyzer (determinístico)    │
                     │  └─────▲──────────────────────────────────┘
                     │        │ señales validadas
                     │  ┌─────┴──────────────┐   IA (opcional, con consentimiento)
                     │  │ server/ai/engines  │── analiza abiertas · formula 1-2
                     │  └────────────────────┘   preguntas · redacta síntesis
                     └──────────────┬────────────────────────────┘
                                    │ (Etapa 2: cuenta + consentimiento)
                     ┌──────────────▼────────────────────────────┐
  Supabase           │ Postgres + RLS · Auth · catálogo verificado │
                     └───────────────────────────────────────────┘
```

| Módulo del brief | Dónde vive | Qué hace la IA | Qué hacen las reglas |
|---|---|---|---|
| A. Profile Analyzer | `src/domain/methodology/profile.ts` | Extrae señales de respuestas abiertas, **solo** sobre facetas conocidas, con pesos acotados | Suma evidencia por faceta, confianza, cobertura por dimensión, tensiones |
| B. Adaptive Question Engine | `src/domain/methodology/engine.ts` | Formula hasta 2 preguntas abiertas de seguimiento | Decide qué preguntar, cuándo profundizar, cuándo aclarar tensiones y cuándo terminar |
| C. Career Matching Engine | `src/domain/matching/match.ts` | Nada | Afinidad personal + académica, descubrimiento, razones trazables |
| D. Report Generator | `src/domain/report/build-report.ts` | Redacta un párrafo de síntesis a partir del informe estructurado | Arma todo el informe; la IA no agrega carreras ni datos |

El dominio (`src/domain`) es TypeScript puro, sin dependencias de framework: se testea con Vitest y puede moverse a un servicio aparte si hace falta.

## 3. Estructura de carpetas

```
docs/                      Documentación de producto y decisiones
data/catalog/              Insumos del catálogo (pendientes de verificación)
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
    methodology/           Dimensiones, facetas, banco de preguntas, perfil, motor, schemas
    matching/              Motor de afinidad
    catalog/               Perfiles metodológicos de áreas (borrador)
    report/                Construcción del informe
  server/                  Solo servidor ("server-only")
    ai/                    Cliente LLM + prompts con guardrails
    repositories/          Persistencia en Supabase (Etapa 2)
    env.ts · supabase.ts
```

## 4. Flujo de navegación

```
Landing ──► /explorar (onboarding, 4 pasos)
              1 edad + año   2 zona   3 áreas en mente (opcional)   4 privacidad + consentimiento IA
        ──► /explorar/test   (pregunta a pregunta; Volver / Saltear; el horizonte se ilumina con la cobertura)
        ──► /explorar/informe (transición de análisis → informe → PDF / volver a explorar)

Etapa 2:  informe ──► crear cuenta (opcional) ──► Mi recorrido (historial, favoritos)
                  └─► ficha de carrera ──► instituciones/sedes ──► comparador
Etapa 3:  /admin (catálogo, preguntas, fuentes) · analytics
```

Decisiones del brief respetadas: se empieza sin cuenta, se completa y se ve el informe como visitante, el informe está en la web y se descarga en PDF, se puede volver a explorar.

## 5. Flujo de datos y privacidad por diseño

- El estado del visitante vive en `sessionStorage` (se borra al cerrar la pestaña).
- El servidor es **sin estado** para visitantes: recibe el estado completo, lo valida con Zod, responde y no guarda nada.
- La IA recibe: el texto de una respuesta abierta (solo con consentimiento) o el perfil estructurado (para la síntesis). Nunca edad, zona ni identificadores.
- Las claves (`OPENAI_API_KEY`, Supabase) solo existen en el servidor. No hay variables `NEXT_PUBLIC_` con secretos.
- Persistencia (Etapa 2): solo con cuenta, con RLS en todas las tablas; la app usa la anon key + sesión del usuario, nunca `service_role`.

Detalle en `PRIVACY.md`.

## 6. Stack

Se mantuvo el stack propuesto. Notas:

- **Next.js 16** (App Router). `middleware` pasó a llamarse `proxy`; `params` y `cookies()` son asíncronos.
- **Tailwind 4** con tokens en `@theme` (`globals.css`).
- **Zod 4** para validar todo lo que entra del cliente y todo lo que devuelve la IA.
- **IA**: `src/server/ai/llm.ts` es la única puerta al proveedor (OpenAI SDK). Cambiar de proveedor = cambiar ese archivo. El modelo se configura con `OPENAI_MODEL`; sin clave o sin modelo, la app funciona entera sin IA.
- Fuentes autoalojadas vía `@fontsource` (Manrope + Instrument Serif): sin llamadas a Google en runtime.

Ver `DECISIONS.md` para el razonamiento de cada elección y `ROADMAP.md` para riesgos y pendientes.
