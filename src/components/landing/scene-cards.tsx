/**
 * Tres escenas inspiradas en la referencia (tarjetas altas con imagen
 * inmersiva y capas de vidrio). Las "fotos" son composiciones CSS
 * provisorias; cada tarjeta acepta `photo` para la fotografía final.
 */
import type { ReactNode } from "react";

function Scene({
  title,
  caption,
  body,
  background,
  children,
}: {
  title: [string, string];
  caption: string;
  body: string;
  background: string;
  children: ReactNode;
}) {
  return (
    <article className="grain relative flex aspect-[4/5.4] w-[82vw] max-w-[380px] shrink-0 snap-center flex-col overflow-hidden rounded-[var(--radius-card)] border border-white/10 sm:w-auto sm:max-w-none">
      <div className="absolute inset-0" style={{ background }} />
      <div className="relative flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="display text-[30px] sm:text-[34px]">
          <span className="block text-white/55">{title[0]}</span>
          <span className="block">{title[1]}</span>
        </h3>
        <div className="flex flex-1 flex-col justify-center gap-2.5 py-6">{children}</div>
        <p className="text-[15px] font-semibold">{caption}</p>
        <p className="mt-1 max-w-[30ch] text-[14px] leading-snug text-[var(--text-muted)]">{body}</p>
      </div>
    </article>
  );
}

function Chip({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="glass rounded-[16px] px-4 py-3">
      <p className="text-[14px] font-medium leading-snug">{children}</p>
      {sub && <p className="mt-1 text-[12px] text-[var(--text-faint)]">{sub}</p>}
    </div>
  );
}

export function SceneCards() {
  return (
    <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 [scrollbar-width:none]">
      <Scene
        title={["No es un cuestionario,", "es una charla"]}
        caption="Preguntas que cambian con vos"
        body="Lo que respondés define qué te preguntamos después. Dos personas nunca hacen el mismo recorrido."
        background="radial-gradient(70% 55% at 70% 30%, rgb(155 203 212 / .55), transparent 70%), radial-gradient(60% 40% at 20% 80%, rgb(201 184 232 / .25), transparent 70%), linear-gradient(170deg, #526e78, #344650 55%, #263740)"
      >
        <div
          aria-hidden
          className="absolute right-[-8%] top-[22%] h-[46%] w-[55%] rounded-full opacity-70"
          style={{ background: "linear-gradient(100deg, transparent, rgb(232 238 240 / .5), transparent)", filter: "blur(22px)", transform: "rotate(-18deg)" }}
        />
        <Chip sub="Elegí hasta 3">¿Qué podrías hacer durante horas sin darte cuenta?</Chip>
        <div className="ml-auto w-[78%]">
          <div className="glass rounded-[16px] px-4 py-3">
            <p className="voice text-[19px]">Editar videos con mis amigos, y que quede perfecto.</p>
          </div>
        </div>
      </Scene>

      <Scene
        title={["Las contradicciones", "también dicen algo"]}
        caption="Detectamos patrones"
        body="Si a veces elegís crear y otras ordenar, no es un error: es una pista para seguir explorando."
        background="radial-gradient(55% 45% at 50% 55%, rgb(184 220 212 / .35), transparent 70%), linear-gradient(180deg, #2b3d47, #22313a)"
      >
        <svg aria-hidden viewBox="0 0 300 300" className="absolute inset-0 m-auto h-[80%] w-[80%] opacity-35">
          {[40, 70, 100, 130].map((r) => (
            <ellipse key={r} cx="150" cy="160" rx={r * 1.1} ry={r * 0.7} fill="none" stroke="#b8dcd4" strokeWidth="0.8" />
          ))}
        </svg>
        <div className="relative w-[80%]"><Chip>Elegís crear en casi todo</Chip></div>
        <div className="relative ml-auto w-[78%]"><Chip>Pero ordenar también aparece</Chip></div>
        <div className="relative w-[70%]"><Chip sub="Te vamos a preguntar más">¿Inventar o mejorar?</Chip></div>
      </Scene>

      <Scene
        title={["Resultados", "que se explican"]}
        caption="Siempre te decimos por qué"
        body="Cada área viene con las respuestas que la respaldan, lo que podría no encajar y lo que falta explorar."
        background="radial-gradient(80% 50% at 50% 0%, rgb(232 238 240 / .45), transparent 70%), linear-gradient(180deg, #7e9ca5, #526e78 45%, #344650)"
      >
        <div className="glass rounded-[18px] p-4">
          <p className="text-[13px] text-[var(--text-muted)]">Afinidad clara</p>
          <p className="mt-0.5 text-[17px] font-semibold">Diseño Industrial</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["hacer con las manos", "lo visual", "crear cosas nuevas"].map((t) => (
              <span key={t} className="rounded-full bg-white/12 px-2.5 py-1 text-[12px]">{t}</span>
            ))}
          </div>
        </div>
        <Chip sub="Para explorar">Todavía no sabemos cómo te llevás con la matemática</Chip>
      </Scene>
    </div>
  );
}
