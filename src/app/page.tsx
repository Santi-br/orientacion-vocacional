import Link from "next/link";
import { Horizon } from "@/components/ui/horizon";
import { LinkButton } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { SceneCards } from "@/components/landing/scene-cards";
import { DIMENSIONS } from "@/domain/methodology/dimensions";

const DIMENSION_COPY: Record<string, string> = {
  intereses: "Los temas y actividades que te atraen, incluso los que todavía no nombraste.",
  personalidad: "Si preferís crear, analizar, ayudar u ordenar. Con gente o en tu mundo.",
  habilidades: "En qué te sentís fuerte hoy. No lo que deberías saber.",
  motivaciones: "Qué te haría sentir que lo que hacés vale la pena.",
  valores: "Las causas y principios que te importan.",
  estilo_vida: "Cómo te imaginás un martes cualquiera dentro de diez años.",
  academicas: "Si aprendés mejor leyendo o haciendo. Carreras cortas o largas.",
  contexto: "Dónde vivís, si vas a trabajar, qué tipo de institución buscás. Nunca para descartar.",
};

const STEPS = [
  { t: "Contanos un poco de vos", d: "Edad aproximada, año del secundario y zona. Sin nombre ni mail." },
  { t: "Explorá", d: "Situaciones, escenarios y algunas preguntas abiertas. Termina cuando tenemos información suficiente, no a la pregunta 20." },
  { t: "Leé tu informe", d: "Áreas afines, por qué aparecen, qué podría no encajar y qué conviene explorar después." },
  { t: "Seguí cuando quieras", d: "Más adelante vas a poder guardar, comparar y actualizar tus resultados con una cuenta." },
];

export default function Landing() {
  return (
    <main className="relative overflow-x-clip">
      {/* ─────────── Hero ─────────── */}
      <section className="relative flex min-h-[100svh] flex-col">
        <Horizon intensity={0.8} />
        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
          <Wordmark />
          <Link href="/privacidad" className="text-[14px] text-[var(--text-muted)] hover:text-frost">
            Tus datos
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-5 pt-[11vh] text-center sm:pt-[13vh]">
          <h1 className="rise display text-[42px] sm:text-[76px]">Antes de elegir<br className="sm:hidden" /> qué estudiar,</h1>
          <div
            className="rise glass mt-5 rounded-[24px] px-5 pb-2.5 pt-1 sm:rounded-[26px] shadow-[0_0_60px_-10px_rgb(184_220_212/0.55)] sm:px-9"
            style={{ animationDelay: "160ms" }}
          >
            <span className="voice whitespace-nowrap text-[35px] text-white [text-shadow:0_0_24px_rgb(232_238_240/0.55)] sm:text-[78px]">
              conocé lo que te mueve
            </span>
          </div>
          <p
            className="rise mt-7 max-w-[34ch] text-[16px] leading-relaxed text-[var(--text-muted)] sm:text-[18px]"
            style={{ animationDelay: "320ms" }}
          >
            Una exploración vocacional que se adapta a vos y te explica por qué te muestra cada carrera.
          </p>

          <div className="mt-auto flex flex-col items-center gap-3 pb-14 pt-10 sm:pb-16">
            <LinkButton href="/explorar" variant="liquid" className="rise" >
              Empezar a explorar
            </LinkButton>
            <p className="text-[13px] text-[var(--text-muted)]">Sin crear cuenta. A tu ritmo.</p>
          </div>
        </div>
      </section>

      {/* ─────────── Escenas ─────────── */}
      <section className="relative bg-graphite px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="display max-w-[18ch] text-[34px] sm:text-[52px]">
            Un test que te escucha en lugar de clasificarte.
          </h2>
          <div className="mt-12 sm:mt-16">
            <SceneCards />
          </div>
        </div>
      </section>

      {/* ─────────── Cómo funciona (claro) ─────────── */}
      <section className="relative bg-frost px-5 py-24 text-ink sm:px-8 sm:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{ background: "linear-gradient(180deg, rgb(155 203 212 / .35), transparent)" }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20">
          <h2 className="display text-[34px] sm:text-[52px]">Cómo funciona</h2>
          <ol className="grid gap-8">
            {STEPS.map((s, i) => (
              <li key={s.t} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-ink/12 pt-6">
                <span className="voice text-[28px] leading-none text-bluegrey">{i + 1}</span>
                <div>
                  <h3 className="text-[19px] font-semibold tracking-[-0.01em]">{s.t}</h3>
                  <p className="mt-1.5 max-w-[52ch] text-[15px] leading-relaxed text-ink/70">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────── Dimensiones ─────────── */}
      <section className="relative overflow-hidden bg-petrol px-5 py-24 sm:px-8 sm:py-32">
        <div
          aria-hidden
          className="absolute -right-40 top-10 h-[520px] w-[520px] rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, #9bcbd4, transparent)", filter: "blur(40px)" }}
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20">
          <div>
            <h2 className="display text-[34px] sm:text-[52px]">
              Ocho miradas sobre vos.
              <span className="block text-white/55">Ninguna etiqueta.</span>
            </h2>
            <p className="mt-5 max-w-[38ch] text-[16px] leading-relaxed text-[var(--text-muted)]">
              Podés tener muchos intereses a la vez. El sistema busca equilibrio entre estas miradas antes de
              mostrarte resultados.
            </p>
          </div>
          <dl className="grid gap-x-10 sm:grid-cols-2">
            {DIMENSIONS.map((d) => (
              <div key={d.id} className="border-t border-white/12 py-5">
                <dt className="text-[17px] font-semibold">{d.label}</dt>
                <dd className="mt-1 text-[14.5px] leading-relaxed text-[var(--text-muted)]">{DIMENSION_COPY[d.id]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────── Transparencia ─────────── */}
      <section className="bg-graphite px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="display max-w-[20ch] text-[34px] sm:text-[52px]">Lo que esto es, y lo que no.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <div className="glass rounded-[var(--radius-card)] p-7 sm:p-9">
              <h3 className="text-[19px] font-semibold">Es</h3>
              <ul className="mt-4 grid gap-3 text-[15.5px] leading-relaxed text-[var(--text-muted)]">
                <li>Una herramienta para descubrir posibilidades, incluso las que no tenías en el radar.</li>
                <li>Recomendaciones que muestran sus razones, sus dudas y sus límites.</li>
                <li>Información de carreras e instituciones tomada de fuentes oficiales. Si un dato falta, lo decimos.</li>
              </ul>
            </div>
            <div className="rounded-[var(--radius-card)] border border-white/12 p-7 sm:p-9">
              <h3 className="text-[19px] font-semibold">No es</h3>
              <ul className="mt-4 grid gap-3 text-[15.5px] leading-relaxed text-[var(--text-muted)]">
                <li>Un diagnóstico psicológico.</li>
                <li>Un test validado científicamente. La metodología se está revisando con profesionales de orientación vocacional.</li>
                <li>Una decisión. Elegir sigue siendo tuyo.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── Cierre ─────────── */}
      <section className="relative flex min-h-[70svh] flex-col items-center justify-center px-5 py-24 text-center">
        <Horizon intensity={0.55} />
        <div className="relative z-10">
          <p className="voice text-[40px] sm:text-[64px]">¿Arrancamos?</p>
          <LinkButton href="/explorar" variant="liquid" className="mt-8">
            Empezar a explorar
          </LinkButton>
        </div>
      </section>

      <footer className="bg-graphite-deep px-5 py-10 text-[13px] text-[var(--text-faint)] sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Wordmark className="text-[var(--text-muted)]" />
          <p>Versión de prueba. Metodología en revisión profesional.</p>
          <Link href="/privacidad" className="hover:text-frost">Cómo cuidamos tus datos</Link>
        </div>
      </footer>
    </main>
  );
}
