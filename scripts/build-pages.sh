#!/usr/bin/env bash
# Build estático para GitHub Pages (sin servidor ni IA).
# Uso: PAGES_BASE_PATH=/orientacion-vocacional bash scripts/build-pages.sh
# Las rutas /api necesitan servidor: se apartan durante el build y se restauran siempre.
set -euo pipefail
cd "$(dirname "$0")/.."
mv src/app/api .api-stash
trap 'mv .api-stash src/app/api' EXIT
NEXT_PUBLIC_STATIC_EXPORT=1 npx next build
touch out/.nojekyll
echo "Sitio estático en ./out"
