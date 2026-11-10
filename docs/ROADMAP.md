# Roadmap, riesgos y decisiones pendientes

## Etapas

**Etapa 0 — Bases (hecho)**
Arquitectura, modelo de datos + RLS, sistema de diseño, landing, onboarding, test adaptativo v1, motor de afinidad explicable, prototipo de informe con PDF por impresión, tests del motor.

**Etapa 1 — Listo para piloto (próximo)**
1. Revisión metodológica con profesionales (ítems, pesos, perfiles de áreas, cierre).
2. Catálogo verificado de 8–10 instituciones (ver `CATALOG.md`) y sección "Dónde estudiarla".
3. Revisión legal de privacidad y consentimiento para menores.
4. Fotografía cinematográfica propia (ver `DESIGN.md`).
5. Rate limiting, logging de errores, deploy en Vercel con dominio de prueba.
6. Encuesta corta al final del informe para medir lo del piloto.

**Etapa 2 — Piloto con 20–30 estudiantes**
Cuentas opcionales (Supabase Auth con link mágico), guardar resultados, Mi recorrido (historial y favoritos), PDF generado en servidor, métricas: finalización, tiempo, abandono por pregunta, identificación con resultados, descubrimientos, utilidad y confianza.

**Etapa 3 — Producto**
Fichas de carrera completas, comparador de carreras e instituciones, panel admin (catálogo, preguntas versionadas, fuentes), analytics, terciarios y tecnicaturas, ampliación geográfica.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Metodología percibida como "científica" sin serlo | Alto | Avisos explícitos, revisión profesional antes del piloto, niveles cualitativos |
| Datos académicos desactualizados o incorrectos | Alto | Fuente + fecha obligatorias, doble revisión, estado `desactualizado` |
| Datos de menores | Alto | Minimización, visitantes sin persistencia, revisión legal, RLS |
| Respuestas que revelan malestar | Alto | Aviso con recursos; definir protocolo con profesionales |
| IA que inventa o induce | Medio | La IA no decide ni agrega datos; salida validada; preguntas generadas acotadas |
| Sesgos (género, nivel socioeconómico) en ítems y recomendaciones | Medio | Revisión de redacción; el contexto nunca descarta; métricas por segmento en el piloto |
| Test largo → abandono | Medio | 25–32 preguntas típicas; medir abandono por ítem en el piloto |
| Costo de IA y abuso de la API | Medio | Rate limiting, IA opcional, modelos chicos |
| Carga del catálogo es mucho trabajo manual | Medio | Empezar acotado; herramientas de extracción asistida con revisión humana |

## Decisiones pendientes (necesitan tu input)

1. **Profesionales de orientación**: ¿quién revisa la metodología y cuándo?
2. **Modelo de IA**: proveedor y modelo para `OPENAI_MODEL` (o evaluar otro proveedor), según costo y términos de datos.
3. **Primeras instituciones** a verificar para el piloto.
4. **Asesoría legal** para consentimiento de menores y política de retención.
5. **Cómo se recluta el piloto** (colegios, redes, conocidos) — define si hace falta consentimiento institucional.
6. **Fotografía**: producción propia o banco con licencia.
