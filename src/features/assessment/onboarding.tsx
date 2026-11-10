"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FACETS, INTEREST_FACETS, type FacetKey } from "@/domain/methodology/dimensions";
import type { Onboarding as OnboardingData } from "@/domain/methodology/types";
import { ChoiceChip, FlowShell } from "./flow-shell";
import { saveSession } from "./session";

const EDADES = [["15", "15"], ["16", "16"], ["17", "17"], ["18", "18"], ["otra", "Otra edad"]] as const;
const ANIOS = [["3", "3.º"], ["4", "4.º"], ["5", "5.º"], ["6", "6.º"], ["egresado", "Ya terminé"], ["otro", "Otro"]] as const;
const ZONAS = [["caba", "CABA"], ["gba_norte", "GBA Norte"], ["gba_oeste", "GBA Oeste"], ["gba_sur", "GBA Sur"], ["otra", "Otra zona"]] as const;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [edad, setEdad] = useState<OnboardingData["edad"]>();
  const [anio, setAnio] = useState<OnboardingData["anio"]>();
  const [zona, setZona] = useState<OnboardingData["zona"]>();
  const [areas, setAreas] = useState<FacetKey[]>([]);
  const [aceptaIA, setAceptaIA] = useState(true);
  const [entiende, setEntiende] = useState(false);

  const toggleArea = (k: FacetKey) =>
    setAreas((a) => (a.includes(k) ? a.filter((x) => x !== k) : a.length < 4 ? [...a, k] : a));

  const canNext = [Boolean(edad && anio), Boolean(zona), true, entiende][step];

  function start() {
    saveSession({ onboarding: { edad: edad!, anio: anio!, zona: zona!, areasConocidas: areas, aceptaIA }, responses: [] });
    router.push("/explorar/test");
  }

  return (
    <FlowShell intensity={0.2 + step * 0.06}>
      <div className="mb-8 flex gap-1.5" aria-label={`Paso ${step + 1} de 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= step ? "bg-mint" : "bg-white/15"}`} />
        ))}
      </div>

      <div key={step} className="rise flex flex-1 flex-col">
        {step === 0 && (
          <>
            <h1 className="display text-[34px] sm:text-[46px]">Primero, un poco de contexto.</h1>
            <p className="mt-3 text-[16px] text-[var(--text-muted)]">No te pedimos nombre, mail ni documento.</p>
            <fieldset className="mt-9">
              <legend className="text-[15px] font-semibold">¿Cuántos años tenés?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {EDADES.map(([v, l]) => (
                  <ChoiceChip key={v} selected={edad === v} onClick={() => setEdad(v)} className="min-w-16 text-center">{l}</ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-8">
              <legend className="text-[15px] font-semibold">¿En qué año del secundario estás?</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {ANIOS.map(([v, l]) => (
                  <ChoiceChip key={v} selected={anio === v} onClick={() => setAnio(v)} className="min-w-16 text-center">{l}</ChoiceChip>
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="display text-[34px] sm:text-[46px]">¿Por dónde vivís?</h1>
            <p className="mt-3 max-w-[46ch] text-[16px] text-[var(--text-muted)]">
              Solo la zona. Sirve para mostrarte opciones cercanas, nunca para descartar otras.
            </p>
            <div className="mt-9 grid gap-2 sm:grid-cols-2">
              {ZONAS.map(([v, l]) => (
                <ChoiceChip key={v} selected={zona === v} onClick={() => setZona(v)}>{l}</ChoiceChip>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="display text-[34px] sm:text-[46px]">¿Ya tenés algo en mente?</h1>
            <p className="mt-3 max-w-[48ch] text-[16px] text-[var(--text-muted)]">
              Marcá hasta 4 áreas que hoy te llamen la atención. Si no tenés ninguna, está perfecto: para eso estamos.
            </p>
            <div className="mt-9 flex flex-wrap gap-2">
              {INTEREST_FACETS.map((k) => (
                <ChoiceChip key={k} selected={areas.includes(k)} onClick={() => toggleArea(k)}>
                  {cap(FACETS[k].label)}
                </ChoiceChip>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="display text-[34px] sm:text-[46px]">Antes de empezar.</h1>
            <ul className="mt-7 grid gap-3 text-[15.5px] leading-relaxed text-[var(--text-muted)]">
              <li>Tus respuestas quedan en este navegador y se borran al cerrar la pestaña. No guardamos nada en nuestros servidores.</li>
              <li>No hay respuestas correctas. Podés saltear cualquier pregunta.</li>
              <li>Si tenés menos de 18, te recomendamos contarle a un adulto de confianza que lo vas a hacer.</li>
            </ul>

            <label className="glass mt-7 flex cursor-pointer gap-4 rounded-[var(--radius-panel)] p-5">
              <input type="checkbox" checked={aceptaIA} onChange={(e) => setAceptaIA(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#9bcbd4]" />
              <span>
                <span className="block text-[15.5px] font-semibold">Analizar mis respuestas escritas con IA</span>
                <span className="mt-1 block text-[14px] leading-relaxed text-[var(--text-muted)]">
                  Suma algunas preguntas abiertas. El texto se envía a un proveedor de IA solo para analizarlo, sin datos
                  que te identifiquen y sin usarlo para publicidad. Si no lo activás, el test funciona igual con preguntas
                  cerradas.
                </span>
              </span>
            </label>

            <label className="mt-3 flex cursor-pointer gap-4 rounded-[var(--radius-panel)] border border-white/12 p-5">
              <input type="checkbox" checked={entiende} onChange={(e) => setEntiende(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#9bcbd4]" />
              <span className="text-[15px] leading-relaxed">
                Entiendo que es una herramienta para explorar, no un diagnóstico psicológico ni una decisión.{" "}
                <Link href="/privacidad" target="_blank" className="underline decoration-white/30 underline-offset-4">
                  Cómo cuidamos tus datos
                </Link>
              </span>
            </label>
          </>
        )}
      </div>

      <nav className="mt-10 flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>Volver</Button>
        ) : <span />}
        {step < 3 ? (
          <Button variant="liquid" disabled={!canNext} onClick={() => setStep(step + 1)}>
            {step === 2 && areas.length === 0 ? "Todavía no, sigamos" : "Seguir"}
          </Button>
        ) : (
          <Button variant="liquid" disabled={!canNext} onClick={start}>Empezar a explorar</Button>
        )}
      </nav>
    </FlowShell>
  );
}
