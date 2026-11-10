"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Horizon } from "@/components/ui/horizon";
import { Wordmark } from "@/components/ui/wordmark";
import { AFFINITY, type ProfileTheme, type Recommendation, type Report } from "@/domain/report/types";
import { clearSession, loadSession } from "@/features/assessment/session";

const STAGES = [
  "Leyendo tus respuestas",
  "Buscando patrones y combinaciones",
  "Cruzándolos con carreras reales",
  "Escribiendo tu informe",
];

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
    const tick = setInterval(() => setStage((x) => Math.min(x + 1, STAGES.length - 1)), 2600);
    const minDelay = new Promise((r) => setTimeout(r, 2400));
    fetch("/api/assessment/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ onboarding: s.onboarding, responses: s.responses, aiTrace: s.aiTrace ?? [] }),
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
        <Horizon intensity={0.55 + stage * 0.12} />
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

  const p = report.profile;
  const models = [...new Set(report.engine.trace.filter((t) => t.ok).map((t) => t.model))];

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
          <p className="voice mt-8 max-w-[34ch] text-[25px] leading-[1.3] sm:text-[30px]">{p.summary}</p>
        </div>
      </section>

      <div className="print-plain mx-auto max-w-4xl px-5 pb-24 sm:px-8">
        {/* ─────────── Perfil ─────────── */}
        <section className="print-break grid gap-x-10 gap-y-8 sm:grid-cols-2">
          <Themes title="Lo que más te atrae" items={p.primary} strong />
          <Themes title="También aparece" items={p.secondary} />
          {p.combinations.length > 0 && <Themes title="Combinaciones interesantes" items={p.combinations} />}
          {p.hobbies.length > 0 && <Themes title="Más pasatiempo que vocación" items={p.hobbies} />}
        </section>

        {(p.tensions.length > 0 || p.unexplored.length > 0) && (
          <section className="mt-12 grid gap-4 sm:grid-cols-2">
            {p.tensions.length > 0 && (
              <div className="glass print-break rounded-[var(--radius-card)] p-6">
                <h3 className="text-[17px] font-semibold">Para seguir pensando</h3>
                <ul className="mt-3 grid gap-3">
                  {p.tensions.map((t) => (
                    <li key={t.label} className="text-[15px] leading-relaxed text-[var(--text-muted)]">
                      <span className="font-semibold text-frost">{cap(t.label)}.</span> {t.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.unexplored.length > 0 && (
              <div className="print-break rounded-[var(--radius-card)] border border-white/12 p-6">
                <h3 className="text-[17px] font-semibold">Todavía no sabemos</h3>
                <ul className="mt-3 grid gap-2 text-[15px] leading-relaxed text-[var(--text-muted)]">
                  {p.unexplored.map((u) => <li key={u}>{u}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* ─────────── Carreras ─────────── */}
        <section className="mt-20">
          <h2 className="display text-[28px] sm:text-[36px]">Carreras para explorar</h2>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--text-muted)]">
            Todas existen en instituciones de CABA y GBA, según sus sitios oficiales. El nivel de afinidad indica cuánto se
            relacionan con lo que contaste: no es una probabilidad de éxito.
          </p>
          <LevelsLegend />
          <div className="mt-6 grid gap-4">
            {report.principal.map((r, i) => <CareerCard key={r.careerId} r={r} open={i === 0} />)}
          </div>
        </section>

        {report.discovery.length > 0 && (
          <section className="mt-20">
            <h2 className="display text-[28px] sm:text-[36px]">Alternativas que quizás no considerabas</h2>
            <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-[var(--text-muted)]">
              No salen de tus intereses más obvios, sino de cómo te gusta trabajar y de lo que te mueve.
            </p>
            <div className="mt-8 grid gap-4">
              {report.discovery.map((r) => <CareerCard key={r.careerId} r={r} />)}
            </div>
          </section>
        )}

        {/* ─────────── Cierre ─────────── */}
        {report.narrative && (
          <section className="print-break mt-20">
            <h2 className="display text-[28px] sm:text-[36px]">Una lectura de conjunto</h2>
            <p className="voice mt-6 max-w-[40ch] text-[22px] leading-[1.4] sm:text-[24px]">{report.narrative}</p>
            {report.closing && <p className="mt-6 max-w-[60ch] text-[15.5px] leading-relaxed text-[var(--text-muted)]">{report.closing}</p>}
          </section>
        )}

        <section className="mt-20 grid gap-4 sm:grid-cols-2">
          <div className="print-break rounded-[var(--radius-card)] border border-white/12 p-6">
            <h3 className="text-[17px] font-semibold">Tu punto de partida</h3>
            <ul className="mt-3 grid gap-1.5 text-[15px] text-[var(--text-muted)]">
              {Object.values(report.context).map((c) => <li key={c}>{c}</li>)}
            </ul>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--text-faint)]">
              Lo usamos para ordenar opciones, nunca para descartarlas.
            </p>
          </div>
          <div className="print-break rounded-[var(--radius-card)] border border-white/12 p-6">
            <h3 className="text-[17px] font-semibold">Cómo se hizo este informe</h3>
            <p className="mt-3 text-[14.5px] leading-relaxed text-[var(--text-muted)]">
              {report.engine.mode === "ia"
                ? "La IA interpretó tus respuestas y eligió carreras solo entre las del catálogo verificado."
                : "Se armó con las reglas del sistema, sin IA."}{" "}
              {report.engine.note}{" "}
              Es una herramienta de exploración: no es un test psicométrico validado, ni un diagnóstico, ni reemplaza una
              orientación profesional.
            </p>
            <p className="mt-3 text-[12.5px] text-[var(--text-faint)]">
              {report.answeredCount} respuestas · metodología {report.methodologyVersion} · catálogo al{" "}
              {fmtDate(report.catalogVersion)}
              {models.length > 0 && ` · ${models.join(", ")}`}
            </p>
          </div>
        </section>

        <nav className="no-print mt-16 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button variant="liquid" onClick={() => window.print()}>Descargar PDF</Button>
          <Button variant="glass" onClick={() => { clearSession(); router.push("/explorar"); }}>Volver a explorar</Button>
          <span className="text-[13px] text-[var(--text-faint)] sm:ml-auto">Guardar y comparar resultados: próximamente.</span>
        </nav>
      </div>
    </main>
  );
}

function Themes({ title, items, strong = false }: { title: string; items: ProfileTheme[]; strong?: boolean }) {
  if (!items.length) return null;
  return (
    <div className="border-t border-white/12 pt-5">
      <h2 className="text-[14px] text-[var(--text-muted)]">{title}</h2>
      <ul className="mt-3 grid gap-3">
        {items.map((t) => (
          <li key={t.label}>
            <p className={strong ? "text-[19px] font-semibold tracking-[-0.01em]" : "text-[16.5px] font-semibold"}>{cap(t.label)}</p>
            {t.detail && <p className="mt-0.5 text-[14.5px] leading-relaxed text-[var(--text-muted)]">{t.detail}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function LevelsLegend() {
  return (
    <details className="no-print mt-4 text-[14px] text-[var(--text-muted)]">
      <summary className="cursor-pointer text-frost/80 underline decoration-white/25 underline-offset-4">
        Qué significa cada nivel
      </summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        {Object.values(AFFINITY).map((a) => (
          <div key={a.label}>
            <dt className="font-semibold text-frost">{a.label}</dt>
            <dd>{a.meaning}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function CareerCard({ r, open = false }: { r: Recommendation; open?: boolean }) {
  return (
    <details open={open} className="glass print-break group rounded-[var(--radius-card)] p-6 sm:p-7">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <div>
          <p className="text-[13.5px] text-sky">{AFFINITY[r.level].label}</p>
          <h3 className="mt-1 text-[21px] font-semibold tracking-[-0.015em] sm:text-[24px]">{r.name}</h3>
          <p className="mt-1.5 max-w-[62ch] text-[15px] leading-relaxed text-[var(--text-muted)]">{r.why}</p>
        </div>
        <span aria-hidden className="no-print mt-1 text-[22px] leading-none text-[var(--text-faint)] transition-transform group-open:rotate-45">+</span>
      </summary>

      <div className="mt-6 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-2">
        {r.matchingInterests.length > 0 && (
          <Block title="Lo que coincide con vos">
            <div className="flex flex-wrap gap-1.5">
              {r.matchingInterests.map((t) => (
                <span key={t} className="rounded-full bg-mint/15 px-3 py-1.5 text-[14px] text-mint">{t}</span>
              ))}
            </div>
          </Block>
        )}

        {r.evidence.length > 0 && (
          <Block title="Respuestas que lo respaldan">
            <ul className="grid gap-3">
              {r.evidence.map((e) => (
                <li key={e.itemId}>
                  <p className="text-[13px] leading-snug text-[var(--text-faint)]">{e.prompt}</p>
                  <p className="voice mt-0.5 text-[19px]">{e.answer}</p>
                  {e.note && <p className="mt-0.5 text-[13.5px] text-[var(--text-muted)]">{e.note}</p>}
                </li>
              ))}
            </ul>
          </Block>
        )}

        {r.activities.length > 0 && (
          <Block title="Actividades que podrían atraerte">
            <List items={r.activities} />
            <p className="mt-2 text-[12.5px] text-[var(--text-faint)]">Orientativo. Las materias concretas dependen del plan de cada institución.</p>
          </Block>
        )}

        {r.misfits.length > 0 && <Block title="Lo que podría no encajar"><List items={r.misfits} /></Block>}
        {r.unknowns.length > 0 && <Block title="Qué conviene averiguar"><List items={r.unknowns} /></Block>}
        {r.related.length > 0 && (
          <Block title="Carreras relacionadas">
            <p className="text-[15px] text-[var(--text-muted)]">{r.related.map((x) => x.name).join(" · ")}</p>
          </Block>
        )}
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <h4 className="text-[14px] font-semibold text-frost/90">Dónde estudiarla</h4>
        <ul className="mt-3 grid gap-3">
          {r.institutions.map((inst) => (
            <li key={inst.institutionId} className="rounded-[var(--radius-panel)] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <p className="text-[16px] font-semibold">{inst.shortName}</p>
                <p className="text-[13px] text-[var(--text-faint)]">{inst.name}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[12.5px]">
                <Badge>{inst.sector === "publica" ? "Pública" : "Privada"}</Badge>
                {inst.matchesSector && <Badge tone="mint">Coincide con tu preferencia</Badge>}
                {inst.campusInZone && <Badge tone="mint">Tiene sede en tu zona</Badge>}
              </div>
              {inst.programs.map((pr) => (
                <div key={pr.officialName} className="mt-3">
                  <p className="text-[14.5px]">{pr.officialName}</p>
                  <p className="text-[12.5px] text-[var(--text-faint)]">
                    {pr.units.join(" · ")}
                    {pr.startNote && ` · ${pr.startNote}`}
                    {pr.orientations.length > 0 && ` · Orientaciones: ${pr.orientations.join(", ")}`}
                  </p>
                  <a href={pr.source} target="_blank" rel="noreferrer" className="text-[12.5px] text-sky underline decoration-sky/30 underline-offset-4">
                    Fuente oficial, consultada el {fmtDate(pr.verifiedAt)}
                  </a>
                </div>
              ))}
              {inst.campuses.length > 0 && (
                <p className="mt-3 text-[12.5px] text-[var(--text-faint)]">
                  Sedes de la institución: {inst.campuses.map((c) => c.address).join(" · ")}. Todavía no verificamos en cuál se dicta esta carrera.
                </p>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--text-faint)]">
          Pendiente de verificar: {r.pendingData.join(", ")}. Consultá la fuente oficial antes de decidir.
        </p>
      </div>
    </details>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-[14px] font-semibold text-frost/90">{title}</h4>
      {children}
    </div>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-1.5 text-[15px] leading-relaxed text-[var(--text-muted)]">
      {items.map((x) => <li key={x}>{x}</li>)}
    </ul>
  );
}

function Badge({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "mint" }) {
  return (
    <span className={`rounded-full px-2.5 py-1 ${tone === "mint" ? "bg-mint/15 text-mint" : "bg-white/[0.08] text-frost/80"}`}>
      {children}
    </span>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function fmtDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}
