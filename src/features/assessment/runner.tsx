"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Answer, Item, ResponseRecord } from "@/domain/methodology/types";
import { requestNext } from "./engine-client";
import { CARE_RESOURCES } from "./care-resources";
import { FlowShell } from "./flow-shell";
import { QuestionView } from "./question-view";
import { loadSession, saveSession, type SessionState } from "./session";

type Progress = { overall: number; dimensions: { id: string; label: string; ratio: number }[] };

export function Runner() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [care, setCare] = useState(false);

  const advance = useCallback(
    async (s: SessionState) => {
      try {
        const data = await requestNext(s);
        const next: SessionState = {
          ...s,
          responses: data.responses,
          aiTrace: [...(s.aiTrace ?? []), ...data.trace].slice(-80),
        };
        if (data.wellbeing) setCare(true);
        setProgress(data.progress);
        if (data.step.type === "done") {
          saveSession({ ...next, finished: true });
          router.push("/explorar/informe");
          return;
        }
        saveSession(next);
        setSession(next);
        setItem(data.step.item);
        setBusy(false);
      } catch {
        setSession(s);
        setError("No pudimos cargar la siguiente pregunta. Revisá tu conexión e intentá de nuevo.");
        setBusy(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/explorar");
      return;
    }
    if (s.finished) {
      router.replace("/explorar/informe");
      return;
    }
    // advance solo actualiza estado después del fetch (asíncrono); falso positivo de la regla.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void advance(s);
  }, [advance, router]);

  /** Acciones del usuario: marcan "ocupado" y piden el siguiente paso. */
  function go(s: SessionState) {
    setBusy(true);
    setError(null);
    void advance(s);
  }

  function answer(a: Answer) {
    if (!session || !item) return;
    const rec: ResponseRecord = {
      itemId: item.id,
      itemVersion: item.version,
      answer: a,
      ...(item.generated ? { generatedItem: item } : {}),
    };
    go({ ...session, responses: [...session.responses, rec] });
  }

  function back() {
    if (!session || session.responses.length === 0) return;
    go({ ...session, responses: session.responses.slice(0, -1) });
  }

  const intensity = 0.12 + (progress?.overall ?? 0) * 0.88;

  return (
    <FlowShell
      intensity={intensity}
      aside={
        <Button variant="ghost" className="px-0" disabled={busy || !session?.responses.length} onClick={back}>
          Volver
        </Button>
      }
    >
      {progress && (
        <div className="mb-8" aria-label="Cuánto te conocemos hasta ahora">
          <div className="flex gap-1.5">
            {progress.dimensions.map((d) => (
              <span key={d.id} title={d.label} className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/12">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-mint transition-[width] duration-700"
                  style={{ width: `${d.ratio * 100}%` }}
                />
              </span>
            ))}
          </div>
          <p className="mt-2.5 text-[13px] text-[var(--text-faint)]">
            El test termina cuando tenemos una idea equilibrada de vos, no en un número fijo de preguntas.
          </p>
        </div>
      )}

      {care && (
        <div role="status" className="glass rise mb-8 rounded-[var(--radius-panel)] p-5">
          <p className="text-[15px] leading-relaxed">
            Gracias por contarnos. Si estás pasando un momento difícil, no tenés que atravesarlo solo o sola: hablalo con un
            adulto de confianza o llamá gratis a estas líneas.
          </p>
          <ul className="mt-3 grid gap-1 text-[15px]">
            {CARE_RESOURCES.map((r) => (
              <li key={r.phone}>
                <a href={`tel:${r.phone.replace(/\D/g, "")}`} className="font-semibold text-mint underline underline-offset-4">{r.phone}</a>{" "}
                <span className="text-[var(--text-muted)]">{r.label}</span>
              </li>
            ))}
          </ul>
          <Button variant="ghost" className="mt-2 px-0" onClick={() => setCare(false)}>Seguir con el test</Button>
        </div>
      )}

      {error && (
        <div role="alert" className="glass mb-6 rounded-[var(--radius-panel)] p-5">
          <p className="text-[15px]">{error}</p>
          <Button variant="liquid" className="mt-4" onClick={() => session && go(session)}>Reintentar</Button>
        </div>
      )}

      {item ? (
        <div className={busy ? "pointer-events-none opacity-60 transition-opacity" : "transition-opacity"}>
          <QuestionView key={`${item.id}-${session?.responses.length}`} item={item} busy={busy} onAnswer={answer} />
        </div>
      ) : (
        !error && <p className="voice mt-20 text-center text-[28px] text-[var(--text-muted)]">Preparando la primera pregunta…</p>
      )}
    </FlowShell>
  );
}
