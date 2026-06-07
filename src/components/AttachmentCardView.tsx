import { useEffect, useState } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import {
  Eye,
  FileText,
  FileSpreadsheet,
  FileType,
  Image as ImageIcon,
  File,
  Download,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import { usePreview } from '../context/PreviewContext';
import { useToast } from '../hooks/useToast';
import type { FileKind } from '../utils/fileKinds';
import { kindLabel } from '../utils/fileKinds';
import { scheduleStoredFileCleanup } from '../utils/scheduleStoredFileCleanup';
import './AttachmentCardView.css';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function KindIcon({ kind }: { kind: FileKind }) {
  const props = { size: 28, className: 'attachment-kind-icon' };
  switch (kind) {
    case 'pdf':
      return <FileType {...props} />;
    case 'word':
      return <FileText {...props} />;
    case 'excel':
      return <FileSpreadsheet {...props} />;
    case 'image':
      return <ImageIcon {...props} />;
    case 'text':
      return <FileText {...props} />;
    default:
      return <File {...props} />;
  }
}

function stopCardEvent(e: React.MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
}

export function AttachmentCardView({ node, selected, deleteNode }: NodeViewProps) {
  const { openPreview } = usePreview();
  const { showSuccess } = useToast();
  const { storedUrl, fileName, fileKind, mimeType, size } = node.attrs as {
    storedUrl: string;
    fileName: string;
    fileKind: FileKind;
    mimeType: string;
    size: number;
  };

  const [missingOnDisk, setMissingOnDisk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!window.electronAPI?.readFileBuffer) return;
      const bytes = await window.electronAPI.readFileBuffer(storedUrl);
      if (!cancelled) setMissingOnDisk(!bytes || bytes.byteLength === 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [storedUrl]);

  const kindClass = fileKind === 'pdf' ? 'kind-pdf' : `kind-${fileKind}`;

  const onPreview = (e: React.MouseEvent) => {
    stopCardEvent(e);
    openPreview({
      mode: 'file',
      title: fileName,
      storedUrl,
      fileKind,
      fileName,
      mimeType,
    });
  };

  const onDelete = (e: React.MouseEvent) => {
    stopCardEvent(e);
    const url = storedUrl;
    deleteNode();
    scheduleStoredFileCleanup(url);
  };

  const onDownload = async (e: React.MouseEvent) => {
    stopCardEvent(e);
    if (!window.electronAPI) return;
    const res = await window.electronAPI.downloadFile(storedUrl, fileName);
    if (res.ok) showSuccess('File disimpan');
  };

  const onShowLocation = async (e: React.MouseEvent) => {
    stopCardEvent(e);
    if (!window.electronAPI) return;
    await window.electronAPI.showFileInFolder(storedUrl);
  };

  return (
    <NodeViewWrapper
      className={`note-attachment-card ${kindClass} ${selected ? 'is-selected' : ''} ${missingOnDisk ? 'is-missing' : ''}`}
      contentEditable={false}
    >
      <div className="attachment-card-inner">
        <KindIcon kind={fileKind} />
        <div className="attachment-card-meta">
          <span className="attachment-card-name">{fileName}</span>
          <span className="attachment-card-sub">
            {missingOnDisk
              ? 'File tidak ada di disk — hapus lalu upload ulang'
              : `${kindLabel(fileKind)} · ${formatSize(size)}`}
          </span>
        </div>
        <div className="attachment-card-actions">
          <button
            type="button"
            className="attachment-action-btn"
            onClick={onShowLocation}
            title="Tampilkan di folder"
          >
            <FolderOpen size={18} />
          </button>
          <button
            type="button"
            className="attachment-action-btn"
            onClick={onDownload}
            title="Unduh file"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            className="attachment-action-btn attachment-action-btn--preview"
            onClick={onPreview}
            title="Lihat preview"
          >
            <Eye size={18} />
          </button>
          <button
            type="button"
            className="attachment-action-btn attachment-action-btn--danger"
            onClick={onDelete}
            title="Hapus dari catatan"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
