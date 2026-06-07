#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/build"

if [[ -f "$ROOT/build/icon.png" ]]; then
  exit 0
fi

if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 512 -h 512 "$ROOT/assets/notes-icon.svg" -o "$ROOT/build/icon.png"
  echo "Generated build/icon.png"
  exit 0
fi

if command -v convert >/dev/null 2>&1; then
  convert -background none "$ROOT/assets/notes-icon.svg" -resize 512x512 "$ROOT/build/icon.png"
  echo "Generated build/icon.png"
  exit 0
fi

echo "build/icon.png not found." >&2
echo "Install: sudo apt install librsvg2-bin   (Ubuntu/Debian)" >&2
echo "Or run the GitHub Release workflow — icon is generated in CI." >&2
exit 1
