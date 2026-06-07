const FILE_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** URL berbasis ID: notes-file://{uuid} */
export function buildStoredFileUrl(fileId: string): string {
  return `notes-file://${fileId}`;
}

export function buildStoredImageUrl(fileId: string): string {
  return `notes-image://${fileId}`;
}

export function fileIdFromStoredUrl(storedUrl: string): string | null {
  const raw = storedUrl
    .replace(/^notes-(?:file|image):\/\//, '')
    .replace(/\/+$/, '')
    .split('?')[0] ?? '';
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    return FILE_ID_RE.test(decoded) ? decoded : null;
  } catch {
    return FILE_ID_RE.test(raw) ? raw : null;
  }
}

/** Legacy: ambil nama disk dari URL lama (bukan UUID) */
export function fileNameFromStoredUrl(storedUrl: string): string {
  const id = fileIdFromStoredUrl(storedUrl);
  if (id) return id;

  const raw = storedUrl
    .replace(/^notes-(?:file|image):\/\//, '')
    .replace(/\/+$/, '')
    .split('?')[0] ?? '';
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** Parse URL dari protocol.handle (Chromium menganggap hostname sebagai bagian path) */
export function fileNameFromProtocolRequest(requestUrl: string): string {
  try {
    const u = new URL(requestUrl);
    const host = u.hostname ? decodeURIComponent(u.hostname) : '';
    const pathPart =
      u.pathname && u.pathname !== '/'
        ? decodeURIComponent(u.pathname.replace(/^\//, ''))
        : '';
    const combined = host + pathPart;
    if (FILE_ID_RE.test(combined)) return combined;
    if (host) return host + pathPart;
    return decodeURIComponent(u.pathname.replace(/^\//, ''));
  } catch {
    return fileNameFromStoredUrl(requestUrl);
  }
}

export function fileIdFromProtocolRequest(requestUrl: string): string | null {
  const raw = fileNameFromProtocolRequest(requestUrl);
  return FILE_ID_RE.test(raw) ? raw : null;
}
