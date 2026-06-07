/** Daftar pintasan keyboard — ditampilkan di Pengaturan */
export interface KeyboardShortcutItem {
  keys: string;
  label: string;
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcutItem[] = [
  { keys: 'Ctrl+N', label: 'Buat catatan baru' },
  { keys: 'Ctrl+F', label: 'Fokus ke pencarian global' },
  { keys: 'Ctrl+,', label: 'Buka pengaturan' },
  { keys: 'Ctrl+Shift+P', label: 'Pin / lepas pin catatan aktif' },
  { keys: 'Ctrl+Shift+E', label: 'Ekspor catatan aktif (Markdown)' },
  { keys: 'Esc', label: 'Tutup pengaturan / drawer' },
];

export function isModKey(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey;
}
