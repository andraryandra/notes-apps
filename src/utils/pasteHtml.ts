/** Deteksi & bersihkan HTML paste (tabel, format dari ChatGPT, web, dll.) */

const RICH_HTML_PATTERN =
  /<(table|thead|tbody|tfoot|tr|th|td|colgroup|col|ul|ol|li|h[1-6]|blockquote|pre|code|hr|dl|dt|dd)\b/i;

const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed', 'form', 'input', 'meta', 'link'];

export function clipboardHasRichHtml(data: DataTransfer | null): boolean {
  if (!data) return false;
  const html = data.getData('text/html')?.trim();
  if (!html) return false;
  return RICH_HTML_PATTERN.test(html);
}

/** Paste hanya gambar jika clipboard bukan HTML kaya (tabel, list, heading, dll.) */
export function shouldPasteAsImageOnly(data: DataTransfer | null): boolean {
  if (!data) return false;
  if (clipboardHasRichHtml(data)) return false;

  const html = data.getData('text/html')?.trim() ?? '';
  const plain = data.getData('text/plain')?.trim() ?? '';

  if (html && !html.includes('data:image/') && html.length > 20) {
    return false;
  }

  if (plain.length > 0 && !html) return false;

  return true;
}

/** Bersihkan HTML berbahaya, pertahankan struktur tabel & format umum */
export function sanitizePastedHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  BLOCKED_TAGS.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  });

  doc.querySelectorAll('style').forEach((el) => el.remove());

  doc.querySelectorAll('table').forEach((table) => {
    if (!table.querySelector('tbody') && table.querySelector('tr')) {
      const tbody = doc.createElement('tbody');
      const rows = Array.from(table.querySelectorAll(':scope > tr'));
      rows.forEach((tr) => tbody.appendChild(tr));
      table.appendChild(tbody);
    }
    table.classList.add('notes-table');
  });

  doc.querySelectorAll('a[href]').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });

  return doc.body.innerHTML;
}
