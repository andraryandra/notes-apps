#!/usr/bin/env bash
# Launcher Notes — dipasang ke ~/.local/bin/notes-app oleh install-desktop.sh
set -eo pipefail

APPIMAGE="${NOTES_APPIMAGE:-@APPIMAGE@}"
RUNTIME="${NOTES_RUNTIME:-$HOME/.local/share/notes-app/notes-app}"
CACHE_DIR="${NOTES_CACHE_DIR:-$HOME/.local/share/notes-app/appimage-cache}"

export ELECTRON_DISABLE_SANDBOX=1

# 1) Binary unpacked — paling cepat
if [[ -x "$RUNTIME" ]]; then
  exec "$RUNTIME" "$@"
fi

if [[ ! -f "$APPIMAGE" ]]; then
  msg="Notes tidak ditemukan. Jalankan: npm run install:app"
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --text="$msg" 2>/dev/null || true
  else
    echo "$msg" >&2
  fi
  exit 1
fi

chmod +x "$APPIMAGE" 2>/dev/null || true

has_fuse2() {
  # Jangan pakai ldconfig — tidak ada di PATH saat dibuka dari ikon GNOME
  [[ -f /lib/x86_64-linux-gnu/libfuse.so.2 ]] \
    || [[ -f /usr/lib/x86_64-linux-gnu/libfuse.so.2 ]] \
    || [[ -f /lib64/libfuse.so.2 ]]
}

# 2) AppImage + FUSE (cepat)
if has_fuse2; then
  unset APPIMAGE_EXTRACT_AND_RUN
  exec "$APPIMAGE" "$@"
fi

# 3) Ekstrak sekali ke cache permanen
cache_run() {
  local exe="$CACHE_DIR/AppRun"
  local stamp="$CACHE_DIR/.source"
  if [[ -x "$exe" ]] && [[ -f "$stamp" ]] && [[ "$(cat "$stamp")" == "$APPIMAGE" ]]; then
    exec "$exe" "$@"
  fi

  mkdir -p "$CACHE_DIR"
  rm -rf "${CACHE_DIR:?}"/*
  local tmp
  tmp="$(mktemp -d)"
  (
    cd "$tmp"
    "$APPIMAGE" --appimage-extract >/dev/null 2>&1
    mv squashfs-root/* "$CACHE_DIR/"
    rmdir squashfs-root 2>/dev/null || true
  )
  rm -rf "$tmp"
  echo "$APPIMAGE" > "$stamp"
  chmod +x "$CACHE_DIR/AppRun" "$CACHE_DIR/notes-app" 2>/dev/null || true
  exec "$CACHE_DIR/AppRun" "$@"
}

cache_run
