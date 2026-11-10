# PROJECT · Plataforma de orientación vocacional

Nombre provisorio. Exploración vocacional adaptativa y explicable para jóvenes de 15 a 18 años de CABA y GBA.

## Correr en local

```bash
npm install
cp .env.example .env.local   # opcional: sin claves funciona sin IA
npm run dev                  # http://localhost:3000
```

```bash
npm test          # tests del motor (Vitest)
npm run lint
npm run build
```

## Qué hay

- Landing, onboarding, test adaptativo y prototipo de informe (con PDF vía imprimir).
- Motor de metodología en `src/domain` (puro, testeado).
- IA opcional en `src/server/ai` (OpenAI SDK; configurar `OPENAI_MODEL`).
- Esquema Supabase con RLS en `supabase/migrations`.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md): módulos, carpetas, navegación
- [Modelo de datos](docs/DATA_MODEL.md)
- [Metodología](docs/METHODOLOGY.md) — borrador, pendiente de revisión profesional
- [Catálogo](docs/CATALOG.md) — proceso de verificación (catálogo vacío a propósito)
- [Privacidad](docs/PRIVACY.md)
- [Diseño](docs/DESIGN.md)
- [Roadmap, riesgos y pendientes](docs/ROADMAP.md)
- [Decisiones](docs/DECISIONS.md)
