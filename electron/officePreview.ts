import fs from 'fs';
import path from 'path';

const MAX_PREVIEW_ROWS = 500;

function readWorkbookBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}

function wrapPreviewHtml(inner: string): string {
  return `<div class="office-preview-root">${inner}</div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Daftar nama sheet Excel — tanpa parse isi sel (cepat). */
export async function listExcelSheetNames(filePath: string): Promise<string[]> {
  if (!fs.existsSync(filePath)) return [];

  try {
    const XLSX = await import('xlsx');
    const ext = path.extname(filePath).toLowerCase();
    const buffer = readWorkbookBuffer(filePath);
    const readOpts =
      ext === '.csv'
        ? ({ type: 'buffer' as const, codepage: 65001, bookSheets: true } as const)
        : ({ type: 'buffer' as const, bookSheets: true } as const);

    const wb = XLSX.read(buffer, readOpts);
    return wb.SheetNames;
  } catch (err) {
    console.error('[Notes] Daftar sheet Excel gagal:', filePath, err);
    return [];
  }
}

/** Preview satu sheet Excel saja — lebih ringan dari render semua sheet. */
export async function previewExcelSheetHtml(
  filePath: string,
  sheetName: string
): Promise<string | null> {
  if (!fs.existsSync(filePath)) return null;

  try {
    const XLSX = await import('xlsx');
    const ext = path.extname(filePath).toLowerCase();
    const buffer = readWorkbookBuffer(filePath);
    const readOpts =
      ext === '.csv'
        ? ({
            type: 'buffer' as const,
            codepage: 65001,
            sheetRows: MAX_PREVIEW_ROWS,
          } as const)
        : ({
            type: 'buffer' as const,
            sheets: [sheetName],
            sheetRows: MAX_PREVIEW_ROWS,
          } as const);

    const wb = XLSX.read(buffer, readOpts);
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return null;

    const tableHtml = XLSX.utils.sheet_to_html(sheet);
    const note =
      ext !== '.csv'
        ? `<p class="office-preview-note">Menampilkan sheet <strong>${escapeHtml(sheetName)}</strong> (maks. ${MAX_PREVIEW_ROWS} baris).</p>`
        : `<p class="office-preview-note">Menampilkan maks. ${MAX_PREVIEW_ROWS} baris.</p>`;

    return wrapPreviewHtml(note + tableHtml);
  } catch (err) {
    console.error('[Notes] Preview sheet Excel gagal:', filePath, sheetName, err);
    return null;
  }
}

/** Preview Word/Excel — Word tetap utuh; Excel pakai sheet pertama (legacy). */
export async function previewOfficeHtml(
  filePath: string,
  kind: 'word' | 'excel',
  sheetName?: string
): Promise<string | null> {
  if (!fs.existsSync(filePath)) return null;

  try {
    if (kind === 'word' && path.extname(filePath).toLowerCase() === '.docx') {
      const mammoth = await import('mammoth');
      const buffer = readWorkbookBuffer(filePath);
      const result = await mammoth.convertToHtml({ buffer });
      return wrapPreviewHtml(result.value);
    }

    if (kind === 'excel') {
      const names = await listExcelSheetNames(filePath);
      if (!names.length) return wrapPreviewHtml('<p>(Kosong)</p>');
      const target = sheetName && names.includes(sheetName) ? sheetName : names[0]!;
      return previewExcelSheetHtml(filePath, target);
    }
  } catch (err) {
    console.error('[Notes] Preview office gagal:', filePath, err);
    return null;
  }

  return null;
}
