#!/usr/bin/env bash
# Daftarkan Notes di menu aplikasi GNOME/KDE (file .desktop + ikon + launcher).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${NOTES_APP_DIR:-$HOME/Applications}"
APPIMAGE="${1:-}"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "install:desktop hanya untuk Linux." >&2
  exit 1
fi

if [[ -z "$APPIMAGE" ]]; then
  shopt -s nullglob
  candidates=("$DEST"/Notes-*.AppImage)
  shopt -u nullglob
  if [[ ${#candidates[@]} -eq 0 ]]; then
    echo "AppImage tidak ditemukan di $DEST" >&2
    echo "Jalankan: npm run install:app" >&2
    exit 1
  fi
  APPIMAGE="$(ls -1t "${candidates[@]}" | head -1)"
fi

if [[ ! -f "$APPIMAGE" ]]; then
  echo "File tidak ada: $APPIMAGE" >&2
  exit 1
fi

chmod +x "$APPIMAGE"
APPIMAGE="$(readlink -f "$APPIMAGE")"

DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/256x256/apps"
ICON_SVG="$HOME/.local/share/icons/notes-app.svg"
LAUNCHER="$HOME/.local/bin/notes-app"
RUNTIME="$HOME/.local/share/notes-app/notes-app"
DESKTOP_FILE="$DESKTOP_DIR/notes-app.desktop"

mkdir -p "$DESKTOP_DIR" "$ICON_DIR" "$(dirname "$LAUNCHER")"
cp -f "$ROOT/assets/notes-icon.svg" "$ICON_SVG"

if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 256 -h 256 "$ICON_SVG" -o "$ICON_DIR/notes-app.png"
elif command -v convert >/dev/null 2>&1; then
  convert -background none "$ICON_SVG" -resize 256x256 "$ICON_DIR/notes-app.png"
else
  cp -f "$ICON_SVG" "$ICON_DIR/notes-app.png" 2>/dev/null || true
fi

sed "s|@APPIMAGE@|$APPIMAGE|g" "$ROOT/scripts/notes-launcher.sh" > "$LAUNCHER"
chmod +x "$LAUNCHER"

# Dari ikon menu: langsung ke binary (tanpa bash/ldconfig) — sama cepatnya seperti terminal
if [[ -x "$RUNTIME" ]]; then
  EXEC_ENV="env ELECTRON_DISABLE_SANDBOX=1"
  EXEC_TARGET="$RUNTIME"
  TRY_EXEC="$RUNTIME"
else
  EXEC_ENV="env ELECTRON_DISABLE_SANDBOX=1"
  EXEC_TARGET="$LAUNCHER"
  TRY_EXEC="$LAUNCHER"
fi

cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=Notes
GenericName=Catatan
Comment=Aplikasi catatan dengan folder, tag, dan editor rich text
TryExec=${TRY_EXEC}
Exec=${EXEC_ENV} ${EXEC_TARGET}
Icon=notes-app
Terminal=false
Categories=Office;
Keywords=notes;catatan;memo;
EOF

chmod +x "$DESKTOP_FILE"

# Hapus entri desktop lama/duplikat di Desktop user jika masih menunjuk AppImage
if [[ -f "$HOME/Desktop/notes-app.desktop" ]]; then
  rm -f "$HOME/Desktop/notes-app.desktop"
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1 && [[ -d "$HOME/.local/share/icons/hicolor" ]]; then
  gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
fi

echo "Entri desktop terpasang:"
echo "  $DESKTOP_FILE"
echo "  Exec: $EXEC_ENV $EXEC_TARGET"
if [[ -x "$RUNTIME" ]]; then
  echo "  (langsung ke runtime cepat — disarankan)"
else
  echo "  Peringatan: runtime belum ada. Jalankan: npm run install:app"
fi
echo ""
echo "Cari \"Notes\" di menu Activities."
