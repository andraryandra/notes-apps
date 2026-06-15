export const NOTE_LINK_PREFIX = 'notes-note://';

export function buildNoteLink(noteId: string): string {
  return `${NOTE_LINK_PREFIX}${noteId}`;
}

export function parseNoteLink(href: string): string | null {
  if (!href.startsWith(NOTE_LINK_PREFIX)) return null;
  const id = href.slice(NOTE_LINK_PREFIX.length).trim();
  return id || null;
}

export function isNoteLink(href: string): boolean {
  return href.startsWith(NOTE_LINK_PREFIX);
}
