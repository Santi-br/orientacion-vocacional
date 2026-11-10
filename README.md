# PROJECT · Plataforma de orientación vocacional

Nombre provisorio. Exploración y orientación vocacional **asistida por IA** para jóvenes de 15 a 18 años de CABA y GBA. No es un test psicométrico validado, ni un diagnóstico, ni reemplaza una orientación profesional.

## Correr en local

```bash
npm install
cp .env.example .env.local   # poné AI_API_KEY (Groq, gratis) para activar la IA; sin clave funciona con reglas
npm run dev                  # http://localhost:3000
```

```bash
npm test               # motor, catálogo, IA (con modelo falso) y esquemas
npm run lint
npm run build
npm run catalog:sql    # regenera supabase/seed/catalog.sql desde data/catalog
```

## Qué hay

- Landing, onboarding con consentimiento, test adaptativo (reglas + IA), informe con carreras reales y PDF.
- IA en cuatro módulos (perfil, preguntas, recomendaciones, informe) con Groq (plan gratis, costo cero), con respaldo por reglas.
- Catálogo verificado: las 11 instituciones prioritarias, 498 ofertas con fuente oficial y fecha.
- Supabase: esquema con RLS, borrado de datos y trazabilidad de modelos y prompts.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md): módulos, carpetas, navegación
- [Arquitectura de IA](docs/AI_ARCHITECTURE.md): modelos, módulos, garantías, trazabilidad
- [Motor de recomendaciones](docs/RECOMMENDATIONS.md)
- [Catálogo académico](docs/ACADEMIC_CATALOG.md): instituciones, fuentes y pendientes
- [Metodología](docs/METHODOLOGY.md)
- [Modelo de datos](docs/DATA_MODEL.md)
- [Privacidad y datos](docs/PRIVACY.md)
- [Diseño](docs/DESIGN.md)
- [Roadmap, hitos y riesgos](docs/ROADMAP.md)
- [Decisiones](docs/DECISIONS.md)
