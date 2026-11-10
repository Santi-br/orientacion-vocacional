import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";

// "PROJECT" es un nombre provisorio. No definir marca hasta tener el nombre real.
export const metadata: Metadata = {
  title: { default: "PROJECT · Exploración vocacional", template: "%s · PROJECT" },
  description:
    "Una exploración vocacional que se adapta a vos y te explica por qué te muestra cada carrera.",
  robots: { index: false }, // MVP privado hasta la validación con estudiantes
};

export const viewport: Viewport = {
  themeColor: "#202B32",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
