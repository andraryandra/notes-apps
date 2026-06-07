/** Tema syntax highlighting JSON (tanpa dependency eksternal) */

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function highlightJsonToHtml(source: string): string {
  if (!source.trim()) return '';

  let html = '';
  let i = 0;
  const len = source.length;

  while (i < len) {
    const ch = source[i];

    if (ch === '"') {
      let j = i + 1;
      while (j < len) {
        if (source[j] === '\\') {
          j += 2;
          continue;
        }
        if (source[j] === '"') {
          j++;
          break;
        }
        j++;
      }
      const str = source.slice(i, j);
      let k = j;
      while (k < len && /\s/.test(source[k])) k++;
      const isKey = source[k] === ':';
      html += `<span class="json-${isKey ? 'key' : 'string'}">${escapeHtml(str)}</span>`;
      i = j;
      continue;
    }

    if (/[-\d]/.test(ch)) {
      const m = source.slice(i).match(/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      if (m) {
        html += `<span class="json-number">${escapeHtml(m[0])}</span>`;
        i += m[0].length;
        continue;
      }
    }

    const word = source.slice(i).match(/^(true|false|null)\b/);
    if (word) {
      const w = word[1];
      const cls = w === 'null' ? 'json-null' : 'json-bool';
      html += `<span class="${cls}">${w}</span>`;
      i += w.length;
      continue;
    }

    if ('{}[]:,'.includes(ch)) {
      html += `<span class="json-punct">${escapeHtml(ch)}</span>`;
      i++;
      continue;
    }

    if (ch === '\n') {
      html += '\n';
      i++;
      continue;
    }

    html += escapeHtml(ch);
    i++;
  }

  return html;
}
