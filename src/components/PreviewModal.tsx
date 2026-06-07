import { useCallback, useEffect, useRef, useState } from 'react';
import { X, ExternalLink, FileText } from 'lucide-react';
import type { FileKind } from '../utils/fileKinds';
import { kindLabel } from '../utils/fileKinds';
import { PdfPreview } from './PdfPreview';
import './PreviewModal.css';

export type PreviewPayload =
  | { mode: 'image'; title: string; src: string }
  | {
      mode: 'file';
      title: string;
      storedUrl: string;
      fileKind: FileKind;
      fileName: string;
      mimeType: string;
    };

interface Props {
  payload: PreviewPayload;
  onClose: () => void;
}

export function PreviewModal({ payload, onClose }: Props) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [officeHtml, setOfficeHtml] = useState<string | null>(null);
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sheetCacheRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const loadExcelSheet = useCallback(async (storedUrl: string, sheetName: string) => {
    const cached = sheetCacheRef.current.get(sheetName);
    if (cached) {
      setActiveSheet(sheetName);
      setOfficeHtml(cached);
      return;
    }

    setSheetLoading(true);
    setActiveSheet(sheetName);
    setOfficeHtml(null);

    try {
      const html = await window.electronAPI?.previewExcelSheet(storedUrl, sheetName);
      if (html) {
        sheetCacheRef.current.set(sheetName, html);
        setOfficeHtml(html);
      } else {
        setError(`Sheet "${sheetName}" tidak bisa dimuat`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat sheet');
    } finally {
      setSheetLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    sheetCacheRef.current = new Map();

    async function load() {
      setLoading(true);
      setError(null);
      setTextContent(null);
      setOfficeHtml(null);
      setExcelSheets([]);
      setActiveSheet(null);
      setSheetLoading(false);
      setImageSrc(null);

      try {
        if (payload.mode === 'image') {
          if (payload.src.startsWith('notes-image://') || payload.src.startsWith('notes-file://')) {
            const resolved = await window.electronAPI?.resolveFile(payload.src);
            if (!cancelled) setImageSrc(resolved || payload.src);
          } else {
            setImageSrc(payload.src);
          }
          return;
        }

        const { storedUrl, fileKind } = payload;

        if (fileKind === 'pdf') {
          return;
        }

        if (fileKind === 'image') {
          const resolved = await window.electronAPI?.resolveFile(storedUrl);
          if (!cancelled) setImageSrc(resolved);
          return;
        }

        if (fileKind === 'text') {
          const text = await window.electronAPI?.readFileAsText(storedUrl);
          if (!cancelled) setTextContent(text ?? '(Kosong)');
          return;
        }

        if (fileKind === 'word') {
          const html = await window.electronAPI?.previewOfficeHtml(storedUrl, 'word');
          if (!cancelled) setOfficeHtml(html);
          return;
        }

        if (fileKind === 'excel') {
          const sheets = (await window.electronAPI?.listExcelSheets(storedUrl)) ?? [];
          if (cancelled) return;

          if (!sheets.length) {
            setError('File Excel kosong atau tidak bisa dibaca');
            return;
          }

          setExcelSheets(sheets);
          setLoading(false);

          const first = sheets[0]!;
          await loadExcelSheet(storedUrl, first);
          return;
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Gagal memuat preview');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [payload, loadExcelSheet]);

  const title = payload.mode === 'image' ? payload.title : payload.fileName;
  const storedUrl = payload.mode === 'file' ? payload.storedUrl : null;
  const fileKind = payload.mode === 'file' ? payload.fileKind : null;

  const openExternal = () => {
    if (storedUrl) void window.electronAPI?.openFileExternal(storedUrl);
  };

  const handleSheetSelect = (sheetName: string) => {
    if (!storedUrl || sheetName === activeSheet) return;
    setError(null);
    void loadExcelSheet(storedUrl, sheetName);
  };

  const officeBusy = fileKind === 'excel' && sheetLoading;
  const showOfficeContent =
    !loading &&
    !error &&
    payload.mode === 'file' &&
    (fileKind === 'word' || fileKind === 'excel') &&
    (officeHtml || officeBusy);

  const isPdfPreview =
    payload.mode === 'file' && fileKind === 'pdf' && storedUrl;

  return (
    <div
      className={`preview-overlay ${isPdfPreview ? 'preview-overlay--pdf' : ''}`}
      onClick={onClose}
    >
      <div
        className={`preview-modal ${isPdfPreview ? 'preview-modal--pdf' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="preview-header">
          <h3 className="preview-title" title={title}>
            {title}
          </h3>
          <div className="preview-header-actions">
            {storedUrl && (
              <button
                type="button"
                className="preview-btn preview-btn--open"
                onClick={openExternal}
                title="Buka dengan aplikasi default"
              >
                <ExternalLink size={18} />
                {(fileKind === 'excel' || fileKind === 'word') && (
                  <span>{fileKind === 'excel' ? 'Buka di Excel' : 'Buka di Word'}</span>
                )}
                {fileKind === 'pdf' && <span>Buka di PDF viewer</span>}
              </button>
            )}
            <button type="button" className="preview-btn" onClick={onClose} title="Tutup">
              <X size={20} />
            </button>
          </div>
        </header>

        <div className={`preview-body ${isPdfPreview ? 'preview-body--pdf' : ''}`}>
          {loading && fileKind !== 'pdf' && <p className="preview-loading">Memuat preview…</p>}
          {error && <p className="preview-error">{error}</p>}

          {!error && payload.mode === 'image' && imageSrc && (
            <img className="preview-image" src={imageSrc} alt={title} />
          )}

          {!error && isPdfPreview && (
            <>
              <div className="preview-office-toolbar">
                <p className="preview-office-hint">
                  Scroll halaman demi halaman — rendering lazy agar lebih ringan.
                </p>
                <button type="button" className="preview-open-btn" onClick={openExternal}>
                  <ExternalLink size={16} />
                  Buka dengan aplikasi default
                </button>
              </div>
              <PdfPreview storedUrl={storedUrl!} />
            </>
          )}

          {!loading && !error && payload.mode === 'file' && fileKind === 'image' && imageSrc && (
            <img className="preview-image" src={imageSrc} alt={title} />
          )}

          {!loading && !error && payload.mode === 'file' && fileKind === 'text' && textContent !== null && (
            <pre className="preview-text">{textContent}</pre>
          )}

          {showOfficeContent && (
            <>
              <div className="preview-office-toolbar">
                <p className="preview-office-hint">
                  {fileKind === 'excel'
                    ? 'Pilih sheet untuk preview — hanya sheet aktif yang dimuat agar lebih cepat.'
                    : 'Preview dokumen — untuk tampilan penuh, buka di aplikasi Word.'}
                </p>
                <button type="button" className="preview-open-btn" onClick={openExternal}>
                  <ExternalLink size={16} />
                  Buka dengan aplikasi default
                </button>
              </div>

              {fileKind === 'excel' && excelSheets.length > 1 && (
                <div className="preview-sheet-tabs" role="tablist" aria-label="Sheet Excel">
                  {excelSheets.map((name) => (
                    <button
                      key={name}
                      type="button"
                      role="tab"
                      aria-selected={activeSheet === name}
                      className={`preview-sheet-tab ${activeSheet === name ? 'is-active' : ''}`}
                      onClick={() => handleSheetSelect(name)}
                      disabled={sheetLoading && activeSheet === name}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {officeBusy && !officeHtml && (
                <p className="preview-loading preview-sheet-loading">Memuat sheet…</p>
              )}

              {officeHtml && (
                <div
                  className="preview-office-html"
                  dangerouslySetInnerHTML={{ __html: officeHtml }}
                />
              )}
            </>
          )}

          {!loading &&
            !error &&
            payload.mode === 'file' &&
            (fileKind === 'word' || fileKind === 'excel') &&
            !officeHtml &&
            !officeBusy && (
              <div className="preview-fallback">
                <FileText size={48} className="preview-fallback-icon" />
                <p>
                  Preview {kindLabel(fileKind!)} tidak bisa dimuat. Format lama (.doc / .xls) atau
                  file rusak mungkin tidak didukung di sini.
                </p>
                <button type="button" className="preview-open-btn" onClick={openExternal}>
                  <ExternalLink size={16} />
                  Buka dengan aplikasi default
                </button>
              </div>
            )}

          {!loading && !error && payload.mode === 'file' && fileKind === 'other' && (
            <div className="preview-fallback">
              <FileText size={48} className="preview-fallback-icon" />
              <p>Preview tidak tersedia untuk jenis file ini.</p>
              <button type="button" className="preview-open-btn" onClick={openExternal}>
                <ExternalLink size={16} />
                Buka dengan aplikasi default
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
