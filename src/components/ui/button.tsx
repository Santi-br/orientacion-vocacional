import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "liquid" | "glass" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[transform,background,opacity] duration-300 ease-[var(--ease-soft)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  liquid: "liquid px-7 py-3.5 text-[15px] hover:-translate-y-0.5",
  glass: "glass px-6 py-3 text-[15px] text-frost hover:bg-white/10",
  ghost: "px-4 py-2.5 text-[15px] text-[var(--text-muted)] hover:text-frost",
};

export function Button({
  variant = "glass",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  variant = "glass",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}
