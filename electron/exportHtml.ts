import fs from 'fs';
import { getMime } from './fileTypes';

/** Ganti notes-image:// / notes-file:// dengan data URL agar ekspor PDF/HTML bisa menampilkan gambar. */
export function inlineStoredUrlsInHtml(
  html: string,
  resolvePath: (storedUrl: string) => string | null
): string {
  return html.replace(
    /((?:src|href)\s*=\s*["'])(notes-(?:image|file):\/\/[^"']+)(["'])/gi,
    (match, prefix: string, url: string, suffix: string) => {
      const fp = resolvePath(url);
      if (!fp) return match;
      try {
        const buf = fs.readFileSync(fp);
        const mime = getMime(fp) || 'application/octet-stream';
        return `${prefix}data:${mime};base64,${buf.toString('base64')}${suffix}`;
      } catch {
        return match;
      }
    }
  );
}
