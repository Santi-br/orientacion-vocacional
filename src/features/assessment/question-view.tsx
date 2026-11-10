"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LIKERT_LABELS } from "@/domain/methodology/profile";
import type { Answer, Item } from "@/domain/methodology/types";
import { ChoiceChip } from "./flow-shell";

type Props = { item: Item; busy: boolean; onAnswer: (a: Answer) => void };

export function QuestionView({ item, busy, onAnswer }: Props) {
  // Las afirmaciones en primera persona son la voz del estudiante → serif itálica.
  const isStatement = item.format === "likert";

  return (
    <section key={item.id} className="rise flex flex-1 flex-col" aria-busy={busy}>
      {item.format === "scenario" && (
        <p className="mb-3 text-[14px] text-sky">Imaginá esta situación</p>
      )}
      {isStatement ? (
        <>
          <p className="mb-3 text-[14px] text-[var(--text-muted)]">¿Cuánto te identifica esta frase?</p>
          <h1 className="voice text-[32px] sm:text-[44px]">“{item.prompt}”</h1>
        </>
      ) : (
        <h1 className="display text-[28px] sm:text-[40px]">{item.prompt}</h1>
      )}
      {item.helper && <p className="mt-3 text-[15px] text-[var(--text-muted)]">{item.helper}</p>}
      {item.generated && (
        <p className="mt-3 text-[13px] text-[var(--text-faint)]">Pregunta formulada a partir de tus respuestas anteriores.</p>
      )}

      <div className="mt-8 flex-1">
        <Body item={item} busy={busy} onAnswer={onAnswer} />
      </div>

      <div className="mt-8 flex justify-center">
        <Button variant="ghost" disabled={busy} onClick={() => onAnswer({ kind: "skip" })}>
          {item.format === "open" ? "Prefiero saltearla" : "No sé / prefiero no responder"}
        </Button>
      </div>
    </section>
  );
}

function Body({ item, busy, onAnswer }: Props) {
  const [picked, setPicked] = useState<string[]>([]);
  const [text, setText] = useState("");

  switch (item.format) {
    case "single":
    case "scenario":
    case "context":
      return (
        <div className="grid gap-2.5">
          {item.options.map((o) => (
            <ChoiceChip
              key={o.id}
              selected={picked.includes(o.id)}
              onClick={() => {
                if (busy) return;
                setPicked([o.id]);
                setTimeout(() => onAnswer({ kind: "choice", optionIds: [o.id] }), 180);
              }}
              className="py-4"
            >
              {o.label}
            </ChoiceChip>
          ))}
        </div>
      );

    case "multi":
      return (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {item.options.map((o) => (
              <ChoiceChip
                key={o.id}
                selected={picked.includes(o.id)}
                onClick={() =>
                  setPicked((p) =>
                    p.includes(o.id) ? p.filter((x) => x !== o.id) : p.length < item.max ? [...p, o.id] : p,
                  )
                }
              >
                {o.label}
              </ChoiceChip>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[14px] text-[var(--text-faint)]">{picked.length} de {item.max}</span>
            <Button variant="liquid" disabled={busy || picked.length === 0} onClick={() => onAnswer({ kind: "choice", optionIds: picked })}>
              Seguir
            </Button>
          </div>
        </>
      );

    case "likert":
      return (
        <div role="radiogroup" className="grid grid-cols-5 gap-2">
          {LIKERT_LABELS.map((l, i) => (
            <button
              key={l}
              role="radio"
              aria-checked={picked[0] === String(i + 1)}
              disabled={busy}
              onClick={() => {
                setPicked([String(i + 1)]);
                setTimeout(() => onAnswer({ kind: "scale", value: i + 1 }), 180);
              }}
              className={`flex flex-col items-center gap-2.5 rounded-[var(--radius-control)] border px-1 py-4 text-[12.5px] leading-tight transition-colors sm:text-[14px] ${
                picked[0] === String(i + 1) ? "border-mint/70 bg-mint/20" : "border-white/12 bg-white/[0.05] hover:bg-white/[0.09]"
              }`}
            >
              <span
                aria-hidden
                className="rounded-full bg-gradient-to-b from-mint to-sky"
                style={{ width: 8 + i * 4, height: 8 + i * 4, opacity: 0.35 + i * 0.16 }}
              />
              {l}
            </button>
          ))}
        </div>
      );

    case "bipolar": {
      const values = [-2, -1, 0, 1, 2];
      return (
        <div>
          <div className="grid grid-cols-2 gap-3 text-[15px] font-medium leading-snug">
            <p>{item.left.label}</p>
            <p className="text-right">{item.right.label}</p>
          </div>
          <div role="radiogroup" className="mt-5 flex items-center justify-between gap-2">
            {values.map((v) => {
              const size = 22 + Math.abs(v) * 10;
              const sel = picked[0] === String(v);
              return (
                <button
                  key={v}
                  role="radio"
                  aria-checked={sel}
                  aria-label={v === 0 ? "En el medio" : `${Math.abs(v) === 2 ? "Mucho más" : "Un poco más"}: ${v < 0 ? item.left.label : item.right.label}`}
                  disabled={busy}
                  onClick={() => {
                    setPicked([String(v)]);
                    setTimeout(() => onAnswer({ kind: "scale", value: v }), 180);
                  }}
                  className="grid h-16 flex-1 place-items-center"
                >
                  <span
                    className={`block rounded-full border transition-all duration-300 ${sel ? "border-mint bg-mint/80 shadow-[0_0_20px_rgb(184_220_212/0.7)]" : "border-white/30 bg-white/[0.06] hover:bg-white/15"}`}
                    style={{ width: size, height: size }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case "open":
      return (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 800))}
            placeholder={item.placeholder ?? "Escribí con tus palabras…"}
            rows={5}
            className="glass voice w-full resize-none rounded-[var(--radius-panel)] p-5 text-[22px] text-white placeholder:text-white/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky"
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[13px] text-[var(--text-faint)]">{text.length}/800</span>
            <Button variant="liquid" disabled={busy || text.trim().length < 3} onClick={() => onAnswer({ kind: "text", text: text.trim() })}>
              Seguir
            </Button>
          </div>
        </div>
      );
  }
}
