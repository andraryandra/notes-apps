#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE="$ROOT/release"
DEST="${NOTES_APP_DIR:-$HOME/Applications}"
RUNTIME_DIR="${NOTES_RUNTIME_DIR:-$HOME/.local/share/notes-app}"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "install:app hanya untuk Linux." >&2
  exit 1
fi

mkdir -p "$DEST"

shopt -s nullglob
images=("$RELEASE"/Notes-*.AppImage)
shopt -u nullglob

if [[ ${#images[@]} -eq 0 ]]; then
  echo "AppImage tidak ditemukan di $RELEASE" >&2
  echo "Jalankan dulu: npm run build" >&2
  exit 1
fi

APPIMAGE="$(ls -1t "${images[@]}" | head -1)"
NAME="$(basename "$APPIMAGE")"
TARGET="$DEST/$NAME"

cp -f "$APPIMAGE" "$TARGET"
chmod +x "$TARGET"

echo "AppImage terpasang:"
echo "  $TARGET"

# Salin linux-unpacked agar buka dari menu cepat (tanpa ekstrak AppImage)
UNPACKED="$RELEASE/linux-unpacked"
if [[ -x "$UNPACKED/notes-app" ]]; then
  mkdir -p "$RUNTIME_DIR"
  rm -rf "$RUNTIME_DIR"/*
  cp -a "$UNPACKED/." "$RUNTIME_DIR/"
  chmod +x "$RUNTIME_DIR/notes-app"
  echo "Runtime cepat terpasang:"
  echo "  $RUNTIME_DIR/notes-app"
else
  echo "Peringatan: linux-unpacked tidak ada — menu akan memakai AppImage (lebih lambat)." >&2
fi

echo ""
bash "$(dirname "$0")/install-desktop.sh" "$TARGET"

echo ""
echo "Jalankan dari menu Activities (Notes) atau:"
echo "  notes-app"
