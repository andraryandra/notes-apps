const FILE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function fileIdFromStoredUrl(storedUrl: string): string | null {
  const raw = storedUrl
    .replace(/^notes-(?:file|image):\/\//, '')
    .replace(/\/+$/, '')
    .split('?')[0] ?? '';
  if (!raw) return null;
  return FILE_ID_RE.test(raw) ? raw : null;
}
