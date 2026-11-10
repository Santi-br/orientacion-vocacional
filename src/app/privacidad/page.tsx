import type { Metadata } from "next";
import { FlowShell } from "@/features/assessment/flow-shell";

export const metadata: Metadata = { title: "Cómo cuidamos tus datos" };

// BORRADOR de producto para pruebas controladas. Antes del lanzamiento público debe
// reemplazarse por la política revisada por asesoría legal (hito obligatorio, ver docs/ROADMAP.md).
export default function Page() {
  return (
    <FlowShell intensity={0.25}>
      <article className="max-w-[62ch]">
        <h1 className="display text-[34px] sm:text-[46px]">Cómo cuidamos tus datos</h1>
        <p className="mt-3 text-[14px] text-[var(--text-faint)]">Versión de prueba. Se revisará con asesoría legal antes de abrir la plataforma al público.</p>
        <div className="mt-8 grid gap-6 text-[16px] leading-relaxed text-[var(--text-muted)]">
          <p>No te pedimos nombre, mail, documento ni fecha de nacimiento para hacer el test. Solo un rango de edad, el año del secundario y una zona aproximada.</p>
          <p>Mientras no tengas cuenta, tus respuestas quedan en tu navegador y se borran cuando cerrás la pestaña. Para calcular tu siguiente pregunta y tu informe las procesamos en nuestro servidor, sin guardarlas.</p>
          <p>Si activás el análisis con IA, tus respuestas (sin edad, zona ni datos que te identifiquen) se envían a un servicio de IA (Groq) únicamente para elegir las próximas preguntas y armar tus recomendaciones. Lo configuramos para que no las guarde. No las usamos para publicidad ni las vendemos.</p>
          <p>Si más adelante creás una cuenta para guardar tus resultados, vas a poder descargarlos y eliminarlos cuando quieras.</p>
          <p>Esta herramienta no es un diagnóstico psicológico. Los resultados son un punto de partida para explorar.</p>
        </div>
      </article>
    </FlowShell>
  );
}
