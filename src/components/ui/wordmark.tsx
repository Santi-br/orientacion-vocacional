import Link from "next/link";

/** Marca provisoria. Reemplazar cuando exista el nombre definitivo. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] ${className}`}>
      <span aria-hidden className="relative inline-block h-3.5 w-3.5 rounded-full bg-gradient-to-b from-mint to-sky shadow-[0_0_14px_rgb(184_220_212/0.7)]" />
      PROJECT
    </Link>
  );
}
