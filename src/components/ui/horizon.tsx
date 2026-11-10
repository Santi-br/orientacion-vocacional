/**
 * Horizonte luminoso: el elemento firma del sistema visual.
 * En la landing es atmósfera; durante el test, `intensity` (0..1) refleja
 * cuánto conocemos a la persona: el horizonte se ilumina a medida que explora.
 *
 * Es una composición CSS (sin fotos). Cuando haya fotografía cinematográfica
 * propia, se coloca como capa `photo` debajo del brillo (ver docs/DESIGN.md).
 */
type Props = { intensity?: number; photo?: string; className?: string };

export function Horizon({ intensity = 0.6, photo, className = "" }: Props) {
  const i = Math.max(0, Math.min(1, intensity));
  return (
    <div aria-hidden className={`grain pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* cielo: grafito con luz, nunca negro */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #26353d 0%, #30444e 34%, #4a6672 62%, #2a3b44 76%, #202b32 100%)",
        }}
      />
      {photo && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-70 mix-blend-luminosity"
          style={{ backgroundImage: `url(${photo})` }}
        />
      )}
      {/* luz del horizonte */}
      <div
        className="absolute left-1/2 top-[73%] h-[50%] w-[150%] rounded-[50%] transition-all duration-[1600ms]"
        style={{
          background:
            "radial-gradient(closest-side, rgb(240 248 246 / 0.95), rgb(184 220 212 / 0.75) 22%, rgb(155 203 212 / 0.38) 48%, rgb(82 110 120 / 0) 78%)",
          opacity: 0.2 + i * 0.8,
          transform: `translate(-50%, -50%) scale(${0.7 + i * 0.4})`,
          filter: "blur(14px)",
        }}
      />
      {/* bruma */}
      <div
        className="absolute left-[-10%] top-[60%] h-[26%] w-[120%] opacity-50"
        style={{
          background:
            "radial-gradient(40% 60% at 30% 50%, rgb(155 203 212 / 0.25), transparent), radial-gradient(35% 50% at 72% 45%, rgb(184 220 212 / 0.22), transparent)",
          filter: "blur(30px)",
          animation: "drift 18s ease-in-out infinite alternate",
        }}
      />
      {/* tierra: silueta suave en petróleo profundo */}
      <svg className="absolute bottom-0 left-0 h-[36%] w-full" viewBox="0 0 1440 400" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hz-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a3c45" />
            <stop offset="1" stopColor="#202b32" />
          </linearGradient>
        </defs>
        <path
          d="M0 170 C 180 120 300 150 460 135 S 760 95 920 128 S 1200 160 1440 118 L1440 400 L0 400 Z"
          fill="url(#hz-ground)"
        />
        <path
          d="M0 240 C 220 200 420 230 640 212 S 1040 190 1440 226 L1440 400 L0 400 Z"
          fill="#202b32"
          opacity="0.9"
        />
      </svg>
      {/* brillo rasante sobre la línea */}
      <div
        className="absolute left-1/2 top-[74.5%] hidden h-px w-[70%] sm:block -translate-x-1/2 transition-opacity duration-[1600ms]"
        style={{
          background: "linear-gradient(90deg, transparent, rgb(232 238 240 / 0.9), transparent)",
          opacity: 0.2 + i * 0.6,
          boxShadow: "0 0 24px 4px rgb(184 220 212 / 0.5)",
        }}
      />
    </div>
  );
}
