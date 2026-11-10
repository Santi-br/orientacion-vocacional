# Privacidad, seguridad y tratamiento de datos

> Diseño técnico, no asesoramiento legal. El producto **no está publicado**: se usa en un prototipo y en pruebas controladas. Antes del lanzamiento público hay un **hito obligatorio de revisión legal** (ver `ROADMAP.md`). No se asumen requisitos legales definitivos sin ese asesoramiento.

## Qué datos se tratan

| Dato | Dónde vive | ¿Sale a terceros? |
|---|---|---|
| Rango de edad, año del secundario, zona aproximada | Navegador (visitante) · `users`/`assessments` (con cuenta) | No |
| Respuestas del test | Navegador (visitante) · `responses` (con cuenta) | Al proveedor de IA (Groq), solo con consentimiento, sin datos identificatorios |
| Perfil y recomendaciones | Navegador · `profiles`, `recommendations` (con cuenta) | No |
| Mail (solo si crea cuenta, hito 8) | `auth.users` de Supabase | No |

No se piden nombre, DNI, fecha de nacimiento ni domicilio.

## Implementado

- **Visitantes sin persistencia.** Estado en `sessionStorage`; se borra al cerrar la pestaña. El servidor procesa cada paso y no guarda nada.
- **IA con consentimiento.** Casilla en el onboarding (activada por defecto, explicada). Sin ella, no hay ninguna llamada a la IA y el test usa reglas.
- **Lo mínimo hacia la IA.** Solo preguntas y respuestas; nunca edad, año, zona ni identificadores.
- **Proveedor gratis elegido por privacidad.** Groq no retiene por defecto los datos de inferencia y permite activar retención cero (Zero Data Retention) en *Data Controls*: **activarla al crear la cuenta**. Se descartó el plan gratis de Gemini porque usa el contenido para mejorar los productos de Google.
- **Respuestas como datos** en los prompts (defensa contra inyección); salidas validadas.
- **Secretos solo en el servidor.** `server-only` impide importar esos módulos desde el cliente; no hay variables `NEXT_PUBLIC_` con claves.
- **RLS en todas las tablas** (probado contra Postgres 16): cada estudiante ve solo lo suyo; no puede asignarse roles; el catálogo solo lo editan editores y administradores; el público ve solo lo verificado.
- **Eliminación.** `delete_my_data()` borra en cascada evaluaciones, respuestas, perfiles, recomendaciones, guardados y comparaciones del usuario autenticado.
- **Retención.** `assessments.expires_at` (365 días por defecto, a confirmar) y purga programada (job comentado en la migración 0001).
- **Sin publicidad.** Las respuestas no se usan para publicidad personalizada; no hay cookies de terceros ni trackers.
- **Bienestar.** Si el análisis de una respuesta abierta sugiere malestar serio, se muestran líneas de ayuda (0800-999-0091 salud mental 24 h; 135 CABA y GBA). Confirmar con fuente oficial antes de las pruebas.

## Pendiente técnico

- Baja de `auth.users` desde una función de servidor con privilegios (complementa `delete_my_data`).
- Exportación de datos propios (derecho de acceso).
- Rate limiting de `/api/assessment/*`.
- Con persistencia: recalcular en servidor las señales de respuestas abiertas en vez de confiar en las que envía el cliente.
- Analytics sin identificadores personales.
- Confirmar en la cuenta de Groq que la retención cero quedó activa y documentar la región de procesamiento.

## Para la revisión legal (antes del lanzamiento público)

Ley 25.326 y normativa complementaria · consentimiento según edad · intervención de responsables parentales · datos de menores · uso de IA · transferencias internacionales (Groq, Supabase, Vercel) · política de privacidad · términos y condiciones · derechos de acceso, rectificación y eliminación.
