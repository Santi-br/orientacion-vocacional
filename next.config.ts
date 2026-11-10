import type { NextConfig } from "next";

/**
 * NEXT_PUBLIC_STATIC_EXPORT=1 genera una versión estática para GitHub Pages:
 * sin servidor, el motor de reglas corre en el navegador (sin IA).
 * PAGES_BASE_PATH es el subdirectorio del sitio (p. ej. /orientacion-vocacional).
 */
const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(isStatic
    ? { output: "export", basePath: process.env.PAGES_BASE_PATH || "", trailingSlash: true, images: { unoptimized: true } }
    : { cacheComponents: true, partialPrefetching: true }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
