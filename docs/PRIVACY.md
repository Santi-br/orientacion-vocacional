# Privacidad y seguridad

> Esto es diseño de producto, no asesoramiento legal. **Antes del piloto hace falta revisión de un/a abogado/a** sobre la Ley 25.326 de Protección de Datos Personales, criterios de la AAIP, el Código Civil y Comercial en lo relativo a adolescentes, y el régimen de consentimiento para menores. Tampoco se trató todavía si corresponde registrar bases de datos.

## Implementado

- **Minimización**: sin nombre, mail, DNI ni fecha de nacimiento para hacer el test. Rango de edad, año y zona aproximada.
- **Visitantes sin persistencia**: estado en `sessionStorage`; el servidor procesa sin guardar.
- **IA opcional y separada**: consentimiento explícito en el onboarding; sin él no hay preguntas abiertas ni llamadas a la IA. A la IA solo llega el texto de la respuesta (o el perfil estructurado), nunca datos de contexto.
- **Respuestas del estudiante tratadas como datos** en los prompts (defensa contra inyección) y salida de la IA validada con Zod y acotada a facetas conocidas.
- **Claves solo en servidor**; `server-only` impide importar esos módulos desde el cliente.
- **No es diagnóstico**: aceptación explícita antes de empezar y aviso en el informe.
- **Bienestar**: si el análisis de una respuesta abierta sugiere malestar serio, se muestra un aviso con líneas de ayuda (0800-999-0091 salud mental 24 h; 135 CABA y GBA). Verificado en prensa el 10/11/2026; **confirmar con fuente oficial** antes del piloto y definir el protocolo con profesionales.

## Diseñado (Etapa 2)

- RLS en todas las tablas; cada estudiante solo ve lo suyo; catálogo editable solo por roles.
- Consentimiento versionado (`users.consent_version`) y aviso a adulto responsable (`guardian_ack`). El mecanismo final para menores lo define la asesoría legal.
- Eliminación de cuenta en cascada; retención con `expires_at` y purga programada.
- Exportación de los datos propios (derecho de acceso).

## Pendiente

- Rate limiting de las rutas `/api/assessment/*` (abuso y costo de IA).
- Revisar términos del proveedor de IA: no entrenamiento con datos, región, retención.
- Cuando haya persistencia, recalcular en servidor las señales de respuestas abiertas en vez de confiar en las que manda el cliente.
- Analytics sin identificadores personales y sin cookies de terceros.
- Prohibición explícita de uso publicitario en términos y contratos.
