"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Horizon } from "@/components/ui/horizon";
import { Wordmark } from "@/components/ui/wordmark";
import { AFFINITY_LABEL, type FieldMatch } from "@/domain/matching/match";
import type { Report } from "@/domain/report/build-report";
import { clearSession, loadSession } from "@/features/assessment/session";

const STAGES = ["Ordenando tus respuestas", "Buscando patrones", "Relacionándolos con áreas de estudio"];

export function ReportView() {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const s = loadSession();
    if (!s?.finished) {
      router.replace(s ? "/explorar/test" : "/explorar");
      return;
    }
    const tick = setInterval(() => setStage((x) => Math.min(x + 1, STAGES.length - 1)), 900);
    const minDelay = new Promise((r) => setTimeout(r, 2400));
    fetch("/api/assessment/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ onboarding: s.onboarding, responses: s.responses }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(async (data: Report) => {
        await minDelay;
        setReport(data);
      })
      .catch(() => setError(true))
      .finally(() => clearInterval(tick));
    return () => clearInterval(tick);
  }, [router]);

  useEffect(() => {
    const open = () => document.querySelectorAll("details").forEach((d) => (d.open = true));
    window.addEventListener("beforeprint", open);
    return () => window.removeEventListener("beforeprint", open);
  }, []);

  if (!report) {
    return (
      <main className="relative grid min-h-[100svh] place-items-center px-5 text-center">
        <Horizon intensity={0.6 + stage * 0.15} />
        <div className="relative z-10">
          {error ? (
            <>
              <p className="text-[17px]">No pudimos armar tu informe. Tus respuestas siguen guardadas en esta pestaña.</p>
              <Button variant="liquid" className="mt-6" onClick={() => location.reload()}>Reintentar</Button>
            </>
          ) : (
            <p key={stage} className="rise voice text-[32px] sm:text-[44px]" aria-live="polite">{STAGES[stage]}…</p>
          )}
        </div>
      </main>
    );
  }

  const summary = report.narrative ?? fallbackSummary(report);

  return (
    <main className="relative">
      {/* ─────────── Encabezado ─────────── */}
      <section className="print-plain relative overflow-hidden px-5 pb-44 pt-6 sm:px-8 sm:pb-56">
        <Horizon intensity={1} className="no-print" />
        <header className="no-print relative z-10 mx-auto flex max-w-4xl items-center justify-between">
          <Wordmark />
          <Button variant="ghost" className="px-0" onClick={() => window.print()}>Descargar PDF</Button>
        </header>
        <div className="relative z-10 mx-auto max-w-4xl pt-16 sm:pt-24">
          <p className="text-[14px] text-[var(--text-muted)]">Tu informe de exploración</p>
          <h1 className="display mt-2 text-[40px] sm:text-[64px]">Lo que vimos en tus respuestas</h1>
          <p className="voice mt-8 max-w-[34ch] text-[25px] leading-[1.3] sm:text-[30px]">{summary}</p>
          <p className="mt-8 text-[13px] text-[var(--text-faint)]">
            {report.answeredCount} respuestas. Metodología {report.methodologyVersion}, en revisión profesional.
          </p>
        </div>
      </section>

      <div className="print-plain mx-auto max-w-4xl px-5 pb-24 sm:px-8">
        {/* ─────────── Perfil ─────────── */}
        <section className="print-break">
          <h2 className="display text-[28px] sm:text-[36px]">Lo que más aparece</h2>
          <dl className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {report.highlights.map((h) => (
              <div key={h.dimension} className="border-t border-white/12 py-4">
                <dt className="text-[14px] text-[var(--text-muted)]">{h.label}</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {h.items.map((t) => (
                    <span key={t} className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[14px]">{t}</span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {(report.emerging.length > 0 || report.tensions.length > 0) && (
          <section className="mt-14 grid gap-4 sm:grid-cols-2">
            {report.emerging.length > 0 && (
              <div className="glass print-break rounded-[var(--radius-card)] p-6">
                <h3 className="text-[17px] font-semibold">Apareció sin que lo marcaras</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-muted)]">
                  Al empezar no elegiste estas áreas, pero tus respuestas apuntan hacia ellas: {list(report.emerging)}.
                </p>
              </div>
            )}
            {report.tensions.length > 0 && (
              <div className="print-break rounded-[var(--radius-card)] border border-white/12 p-6">
                <h3 className="text-[17px] font-semibold">Para seguir pensando</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-muted)]">
                  Sobre {list(report.tensions.map((t) => t.label))} respondiste en direcciones distintas. No es un error:
                  puede depender del contexto, y vale la pena explorarlo.
                </p>
              </div>
            )}
          </section>
        )}

        {/* ─────────── Áreas ─────────── */}
        <section className="mt-20">
          <h2 className="display text-[28px] sm:text-[36px]">Áreas de estudio para explorar</h2>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--text-muted)]">
            Ordenadas por afinidad con tus respuestas. La afinidad no es una probabilidad de éxito ni una predicción:
            indica cuánto se relacionan con lo que contaste.
          </p>
          <div className="mt-8 grid gap-4">
            {report.principal.map((m, i) => <FieldCard key={m.field.id} m={m} open={i === 0} />)}
          </div>
        </section>

        {report.discovery.length > 0 && (
          <section className="mt-20">
            <h2 className="display text-[28px] sm:text-[36px]">
              Alternativas que quizás no considerabas
            </h2>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--text-muted)]">
              No son tu área de interés más marcada, pero se conectan con cómo te gusta trabajar y con lo que te mueve.
            </p>
            <div className="mt-8 grid gap-4">
              {report.discovery.map((m) => <FieldCard key={m.field.id} m={m} />)}
            </div>
          </section>
        )}

        {/* ─────────── Contexto y límites ─────────── */}
        <section className="mt-20 grid gap-4 sm:grid-cols-2">
          <div className="print-break rounded-[var(--radius-card)] border border-white/12 p-6">
            <h3 className="text-[17px] font-semibold">Tu punto de partida</h3>
            <ul className="mt-3 grid gap-1.5 text-[15px] text-[var(--text-muted)]">
              {Object.values(report.context).map((c) => <li key={c}>{c}</li>)}
            </ul>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--text-faint)]">
              Lo usamos para mostrarte opciones, nunca para descartarlas.
            </p>
          </div>
          <div className="print-break rounded-[var(--radius-card)] border border-white/12 p-6">
            <h3 className="text-[17px] font-semibold">Cómo leer este informe</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--text-muted)]">
              Es un punto de partida para conversar y seguir investigando, no un diagnóstico ni una decisión. La
              metodología está en revisión con profesionales de orientación vocacional.
              {report.gaps.length > 0 && ` Quedó menos información sobre: ${list(report.gaps).toLowerCase()}.`}
            </p>
          </div>
        </section>

        <nav className="no-print mt-16 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button variant="liquid" onClick={() => window.print()}>Descargar PDF</Button>
          <Button variant="glass" onClick={() => { clearSession(); router.push("/explorar"); }}>Volver a explorar</Button>
          <span className="text-[13px] text-[var(--text-faint)] sm:ml-auto">
            Guardar y comparar resultados: próximamente.
          </span>
        </nav>
      </div>
    </main>
  );
}

function FieldCard({ m, open = false }: { m: FieldMatch; open?: boolean }) {
  return (
    <details open={open} className="glass print-break group rounded-[var(--radius-card)] p-6 sm:p-7">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-[13.5px] text-sky">{AFFINITY_LABEL[m.level]}</p>
          <h3 className="mt-1 text-[21px] font-semibold tracking-[-0.015em] sm:text-[24px]">{m.field.name}</h3>
          <p className="mt-1.5 max-w-[60ch] text-[15px] leading-relaxed text-[var(--text-muted)]">{m.field.summary}</p>
        </div>
        <span aria-hidden className="no-print mt-1 text-[22px] leading-none text-[var(--text-faint)] transition-transform group-open:rotate-45">+</span>
      </summary>

      <div className="mt-6 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-2">
        <Block title="Por qué aparece">
          <div className="flex flex-wrap gap-1.5">
            {m.reasons.map((r) => (
              <span key={r.facet} className="rounded-full bg-mint/15 px-3 py-1.5 text-[14px] text-mint">{r.label}</span>
            ))}
          </div>
        </Block>

        {m.supports.length > 0 && (
          <Block title="Lo que lo respalda">
            <ul className="grid gap-3">
              {m.supports.map((s) => (
                <li key={s.itemId}>
                  <p className="text-[13px] leading-snug text-[var(--text-faint)]">{s.prompt}</p>
                  <p className="voice mt-0.5 text-[19px]">{s.answer}</p>
                </li>
              ))}
            </ul>
          </Block>
        )}

        {m.misfits.length > 0 && (
          <Block title="Lo que podría no encajar">
            <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
              Suele pedir {list(m.misfits.map((r) => r.label))}, y tus respuestas fueron por otro lado.
            </p>
          </Block>
        )}

        {m.unexplored.length > 0 && (
          <Block title="Todavía no sabemos">
            <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
              Cómo te llevás con {list(m.unexplored)}. Vale la pena averiguarlo.
            </p>
          </Block>
        )}

        <Block title="Áreas cercanas">
          <p className="text-[15px] text-[var(--text-muted)]">{list(m.related)}</p>
        </Block>

        <Block title="Dónde estudiarla">
          <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">{m.practical.note}</p>
        </Block>
      </div>
    </details>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-[14px] font-semibold text-frost/90">{title}</h4>
      {children}
    </div>
  );
}

function list(xs: string[]) {
  if (xs.length <= 1) return xs.join("");
  return `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}`;
}

/** Une dos frases que ya pueden contener "y" sin que se lea "x y y". */
function pair(xs: string[], prep = "") {
  return xs.length === 2 ? `${xs[0]}, y también ${prep}${xs[1]}` : xs.join("");
}

function fallbackSummary(r: Report): string {
  const by = (id: string) => r.highlights.find((h) => h.dimension === id)?.items ?? [];
  const parts: string[] = [];
  const i = by("intereses").slice(0, 2);
  const m = by("personalidad").slice(0, 2);
  const mot = by("motivaciones").slice(0, 1);
  if (i.length) parts.push(`Te atraen temas de ${pair(i, "de ")}.`);
  if (m.length) parts.push(`Disfrutás ${pair(m)}.`);
  if (mot.length) parts.push(`Y te mueve ${mot[0]}.`);
  return parts.join(" ") || "Estas son las áreas que más se relacionan con lo que contaste.";
}
