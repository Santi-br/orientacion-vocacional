import Link from "next/link";
import type { ReactNode } from "react";
import { Horizon } from "@/components/ui/horizon";
import { Wordmark } from "@/components/ui/wordmark";

export function FlowShell({
  intensity = 0.35,
  children,
  aside,
}: {
  intensity?: number;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-[100svh] flex-col">
      <div className="fixed inset-0">
        <Horizon intensity={intensity} />
      </div>
      <header className="no-print relative z-10 mx-auto flex w-full max-w-3xl items-center justify-between px-5 pt-5 sm:pt-7">
        <Wordmark />
        {aside ?? (
          <Link href="/" className="text-[14px] text-[var(--text-muted)] hover:text-frost">
            Salir
          </Link>
        )}
      </header>
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pb-10 pt-8 sm:pt-14">
        {children}
      </div>
    </main>
  );
}

export function ChoiceChip({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`rounded-[var(--radius-control)] border px-4 py-3 text-left text-[15px] leading-snug transition-colors duration-200 ${
        selected
          ? "border-mint/70 bg-mint/20 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]"
          : "border-white/14 bg-white/[0.05] text-frost/90 hover:bg-white/[0.09]"
      } ${className}`}
    >
      {children}
    </button>
  );
}
