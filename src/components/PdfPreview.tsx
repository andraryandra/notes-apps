import { useEffect, useRef, useState } from 'react';
import { pdfjsLib } from '../utils/pdfjsSetup';
import './PdfPreview.css';

interface PdfPageProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNum: number;
  width: number;
}

function PdfPage({ pdf, pageNum, width }: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const renderedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || renderedRef.current || !canvasRef.current) return;

    let cancelled = false;
    renderedRef.current = true;

    void (async () => {
      const page = await pdf.getPage(pageNum);
      if (cancelled || !canvasRef.current) return;

      const baseViewport = page.getViewport({ scale: 1 });
      const scale = Math.min(width / baseViewport.width, 2);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);

      await page.render({ canvasContext: ctx, viewport }).promise;
    })();

    return () => {
      cancelled = true;
    };
  }, [visible, pdf, pageNum, width]);

  const placeholderHeight = Math.round(width * 1.414);

  return (
    <div ref={containerRef} className="pdf-page-wrap">
      {visible ? (
        <canvas ref={canvasRef} className="pdf-page-canvas" />
      ) : (
        <div className="pdf-page-placeholder" style={{ height: placeholderHeight }} aria-hidden />
      )}
      <span className="pdf-page-label">Halaman {pageNum}</span>
    </div>
  );
}

interface Props {
  storedUrl: string;
}

export function PdfPreview({ storedUrl }: Props) {
  const [pdf, setPdf] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState(720);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => setPageWidth(Math.max(320, el.clientWidth - 32));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let doc: pdfjsLib.PDFDocumentProxy | null = null;

    setLoading(true);
    setError(null);
    setPdf(null);
    setNumPages(0);

    void (async () => {
      try {
        const normalizedUrl = storedUrl.replace(/\/+$/, '');
        const bytes = await window.electronAPI?.readFileBuffer(normalizedUrl);
        if (!bytes) {
          throw new Error('PDF tidak ditemukan');
        }

        const task = pdfjsLib.getDocument({ data: bytes });
        doc = await task.promise;
        if (cancelled) return;
        setPdf(doc);
        setNumPages(doc.numPages);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat PDF');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      void doc?.destroy();
    };
  }, [storedUrl]);

  if (loading) return <p className="preview-loading">Memuat PDF…</p>;
  if (error) return <p className="preview-error">{error}</p>;
  if (!pdf || numPages === 0) return <p className="preview-error">PDF kosong</p>;

  return (
    <div ref={scrollRef} className="pdf-preview-scroll">
      <p className="pdf-preview-meta">{numPages} halaman — hanya halaman terlihat yang di-render.</p>
      {Array.from({ length: numPages }, (_, i) => (
        <PdfPage key={i + 1} pdf={pdf} pageNum={i + 1} width={pageWidth} />
      ))}
    </div>
  );
}
