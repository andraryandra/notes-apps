import { useEffect, useState, useCallback, useMemo } from 'react';
import { X, Download, Upload, HardDrive, FolderOpen, Trash2, Image, Paperclip, Database, Keyboard, Languages, Globe, ZoomIn, ZoomOut, RotateCcw, RefreshCw } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useConfirm } from '../hooks/useConfirm';
import { useI18n } from '../i18n/useI18n';
import { createTranslator } from '../i18n/translator';
import {
  THEME_OPTIONS,
  LAYOUT_OPTIONS,
  APP_LOCALES,
  uiZoomPercent,
  type AppLocale,
  type AppTheme,
  type AppLayoutMode,
} from '../config/appearance';
import { SCROLL_BATCH_SIZES, SQLITE_DB_NAME, type ScrollBatchSize } from '../config/storage';
import { APP_TIME_ZONES, formatTimeZoneLabel, isValidTimeZone } from '../config/timezones';
import { localeTag } from '../i18n/localeFormat';
import type { StorageInfo, StoredFileInventory, StoredFileKind } from '../types';
import './SettingsModal.css';

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKey(fileId: string): string {
  return fileId;
}

interface Props {
  theme: AppTheme;
  layout: AppLayoutMode;
  scrollBatchSize: ScrollBatchSize;
  locale: AppLocale;
  timeZone: string;
  uiZoomLevel: number;
  onThemeChange: (t: AppTheme) => void;
  onLayoutChange: (l: AppLayoutMode) => void;
  onScrollBatchSizeChange: (size: ScrollBatchSize) => void;
  onLocaleChange: (locale: AppLocale) => void;
  onTimeZoneChange: (timeZone: string) => void;
  onUiZoomLevelChange: (level: number) => void;
  onAdjustUiZoomLevel: (delta: number) => void;
  onCheckForUpdates: () => Promise<unknown>;
  onClose: () => void;
  onRestoreComplete: () => void;
}

const SHORTCUT_ROWS = [
  { keys: 'Ctrl+N', labelKey: 'shortcuts.newNote' },
  { keys: 'Ctrl+F', labelKey: 'shortcuts.focusSearch' },
  { keys: 'Ctrl+,', labelKey: 'shortcuts.openSettings' },
  { keys: 'Ctrl+Shift+P', labelKey: 'shortcuts.togglePin' },
  { keys: 'Ctrl+Shift+E', labelKey: 'shortcuts.exportNote' },
  { keys: 'Ctrl + / Ctrl -', labelKey: 'shortcuts.zoom' },
  { keys: 'Ctrl+0', labelKey: 'shortcuts.zoomReset' },
  { keys: 'Esc', labelKey: 'shortcuts.escape' },
] as const;

export function SettingsModal({
  theme,
  layout,
  scrollBatchSize,
  locale,
  timeZone,
  uiZoomLevel,
  onThemeChange,
  onLayoutChange,
  onScrollBatchSizeChange,
  onLocaleChange,
  onTimeZoneChange,
  onUiZoomLevelChange,
  onAdjustUiZoomLevel,
  onCheckForUpdates,
  onClose,
  onRestoreComplete,
}: Props) {
  const { t, locale: ctxLocale } = useI18n();
  const { confirm } = useConfirm();
  const dateLocaleTag = localeTag(ctxLocale);
  const [appVersion, setAppVersion] = useState('…');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const timezoneOptions = useMemo(() => {
    const ids = new Set<string>(APP_TIME_ZONES);
    if (isValidTimeZone(timeZone)) ids.add(timeZone);
    return [...ids].map((tz) => ({
      id: tz,
      label: formatTimeZoneLabel(tz, dateLocaleTag),
    }));
  }, [timeZone, dateLocaleTag]);
  const { showSuccess } = useToast();
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [inventory, setInventory] = useState<StoredFileInventory | null>(null);
  const [fileTab, setFileTab] = useState<StoredFileKind>('image');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);

  const reloadStorage = useCallback(async () => {
    if (!window.electronAPI) return;
    const [storageInfo, fileInventory] = await Promise.all([
      window.electronAPI.getStorageInfo(),
      window.electronAPI.getFileInventory(),
    ]);
    setInfo(storageInfo);
    setInventory(fileInventory);
  }, []);

  useEffect(() => {
    void reloadStorage();
  }, [reloadStorage]);

  useEffect(() => {
    void window.electronAPI?.getAppVersion().then((v) => setAppVersion(v));
  }, []);

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      await onCheckForUpdates();
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleExport = async () => {
    setBusy(true);
    const res = await window.electronAPI.exportBackup();
    setBusy(false);
    if (res.ok) {
      showSuccess(t('settings.backupExported'));
    }
  };

  const handleRestore = async () => {
    const ok = await confirm({
      title: t('settings.restoreTitle'),
      message: t('settings.restoreConfirm'),
      confirmLabel: t('settings.restoreConfirmAction'),
      variant: 'danger',
    });
    if (!ok) return;

    setBusy(true);
    const res = await window.electronAPI.restoreBackup();
    setBusy(false);
    if (res.ok) {
      showSuccess(t('settings.restoreDone'));
      onRestoreComplete();
    }
  };

  const openFolder = (which: 'data' | 'images' | 'attachments') => {
    void window.electronAPI?.openStorageFolder(which);
  };

  const handleDeleteFile = async (fileId: string, displayName: string, used: boolean) => {
    if (!window.electronAPI) return;

    if (used) {
      const entry = inventory?.files.find((f) => f.fileId === fileId);
      const notes = entry?.usedInNotes.join(', ') || t('settings.someNotes');
      const ok = await confirm({
        title: t('settings.confirmDeleteFile'),
        message: t('settings.deleteUsedFileConfirm', { notes }),
        confirmLabel: t('common.delete'),
        variant: 'danger',
      });
      if (!ok) return;
      setBusy(true);
      const res = await window.electronAPI.deleteStoredFile(fileId, true);
      setBusy(false);
      if (res.ok) {
        showSuccess(t('settings.fileDeleted'));
        void reloadStorage();
      }
      return;
    }

    const ok = await confirm({
      title: t('settings.confirmDeleteFile'),
      message: t('settings.deleteFileConfirm', { name: displayName }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    const res = await window.electronAPI.deleteStoredFile(fileId);
    setBusy(false);
    if (res.ok) {
      showSuccess(t('settings.fileDeleted'));
      void reloadStorage();
    }
  };

  const tabFiles =
    inventory?.files.filter((f) => f.kind === fileTab) ?? [];
  const imageCount = inventory?.files.filter((f) => f.kind === 'image').length ?? 0;
  const attachmentCount = inventory?.files.filter((f) => f.kind === 'attachment').length ?? 0;

  const selectedInTab = tabFiles.filter((f) => selectedKeys.has(fileKey(f.fileId)));
  const allTabSelected = tabFiles.length > 0 && selectedInTab.length === tabFiles.length;

  useEffect(() => {
    setSelectedKeys(new Set());
  }, [fileTab]);

  const toggleFileSelected = (fileId: string) => {
    const key = fileKey(fileId);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAllTab = () => {
    if (allTabSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const f of tabFiles) next.delete(fileKey(f.fileId));
        return next;
      });
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const f of tabFiles) next.add(fileKey(f.fileId));
        return next;
      });
    }
  };

  const handleBulkDeleteSelected = async () => {
    if (!window.electronAPI || selectedInTab.length === 0) return;

    const usedCount = selectedInTab.filter((f) => f.used).length;
    let message = t('settings.bulkDeleteConfirm', { count: selectedInTab.length });
    if (usedCount > 0) {
      message += t('settings.bulkDeleteUsedWarning', { count: usedCount });
    }
    const ok = await confirm({
      title: t('settings.confirmDeleteFiles'),
      message,
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;

    setBusy(true);
    let deleted = 0;
    for (const file of selectedInTab) {
      const res = await window.electronAPI.deleteStoredFile(
        file.fileId,
        file.used ? true : undefined
      );
      if (res.ok) deleted++;
    }
    setBusy(false);
    setSelectedKeys(new Set());
    showSuccess(t('settings.filesDeleted', { count: deleted }));
    void reloadStorage();
  };

  const handleDeleteUnused = async () => {
    if (!inventory?.unusedCount) return;
    const ok = await confirm({
      title: t('settings.confirmDeleteUnused'),
      message: t('settings.deleteUnusedConfirm', { count: inventory.unusedCount }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    const res = await window.electronAPI?.deleteUnusedStoredFiles();
    setBusy(false);
    if (res?.ok) {
      showSuccess(t('settings.filesDeleted', { count: res.deleted }));
      void reloadStorage();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="settings-modal settings-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>{t('settings.title')}</h2>
          <button type="button" className="settings-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <section className="settings-section">
          <h3>
            <Languages size={16} />
            {t('settings.language')}
          </h3>
          <p className="settings-info-text">{t('settings.languageDesc')}</p>
          <div className="settings-page-size-row">
            {APP_LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                className={`settings-page-size-btn ${locale === loc ? 'active' : ''}`}
                disabled={busy}
                onClick={() => {
                  void onLocaleChange(loc);
                  showSuccess(createTranslator(loc)('app.toast.languageChanged'));
                }}
              >
                {loc === 'id' ? t('settings.languageId') : t('settings.languageEn')}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3>
            <Globe size={16} />
            {t('settings.timezone')}
          </h3>
          <p className="settings-info-text">{t('settings.timezoneDesc')}</p>
          <select
            className="settings-timezone-select"
            value={timeZone}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.value;
              onTimeZoneChange(next);
              showSuccess(
                t('settings.timezoneApplied', {
                  label: formatTimeZoneLabel(next, dateLocaleTag),
                })
              );
            }}
          >
            {timezoneOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </section>

        <section className="settings-section">
          <h3>
            <ZoomIn size={16} />
            {t('settings.zoom')}
          </h3>
          <p className="settings-info-text">{t('settings.zoomDesc')}</p>
          <div className="settings-page-size-row settings-zoom-row">
            <button
              type="button"
              className="settings-page-size-btn"
              disabled={busy}
              title={t('settings.zoomOut')}
              onClick={() => void onAdjustUiZoomLevel(-0.5)}
            >
              <ZoomOut size={16} />
            </button>
            <span className="settings-zoom-value">{uiZoomPercent(uiZoomLevel)}%</span>
            <button
              type="button"
              className="settings-page-size-btn"
              disabled={busy}
              title={t('settings.zoomIn')}
              onClick={() => void onAdjustUiZoomLevel(0.5)}
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              className="settings-page-size-btn"
              disabled={busy || uiZoomLevel === 0}
              title={t('settings.zoomReset')}
              onClick={() => void onUiZoomLevelChange(0)}
            >
              <RotateCcw size={16} />
              {t('settings.zoomReset')}
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h3>
            <RefreshCw size={16} />
            {t('updater.title')}
          </h3>
          <p className="settings-info-text">{t('updater.desc', { version: appVersion })}</p>
          <button
            type="button"
            className="settings-btn"
            disabled={busy || checkingUpdate}
            onClick={() => void handleCheckUpdate()}
          >
            <RefreshCw size={16} className={checkingUpdate ? 'settings-icon-spin' : undefined} />
            {checkingUpdate ? t('updater.checking') : t('updater.check')}
          </button>
        </section>

        <section className="settings-section">
          <h3>{t('settings.layout')}</h3>
          <div className="layout-grid">
            {LAYOUT_OPTIONS.map((l) => (
              <button
                key={l.id}
                type="button"
                className={`layout-card ${layout === l.id ? 'active' : ''}`}
                onClick={async () => {
                  await onLayoutChange(l.id);
                  const label = t(`appearance.layout.${l.id}.label`);
                  showSuccess(t('settings.layoutApplied', { label }));
                }}
              >
                <span className="layout-card-label">{t(`appearance.layout.${l.id}.label`)}</span>
                <span className="layout-card-desc">{t(`appearance.layout.${l.id}.desc`)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3>{t('settings.theme')}</h3>
          <p className="settings-info-text">{t('settings.themeDesc')}</p>
          <div className="theme-grid theme-grid--scroll">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`theme-card ${theme === opt.id ? 'active' : ''}`}
                onClick={async () => {
                  await onThemeChange(opt.id);
                  const label = t(`appearance.theme.${opt.id}.label`);
                  showSuccess(t('settings.themeApplied', { label }));
                }}
              >
                <span
                  className="theme-card-swatch"
                  style={{
                    background: `linear-gradient(135deg, ${opt.preview.bg} 50%, ${opt.preview.surface} 50%)`,
                    boxShadow: `inset 0 0 0 2px ${opt.preview.accent}`,
                  }}
                  aria-hidden
                />
                <span className="theme-card-label">{t(`appearance.theme.${opt.id}.label`)}</span>
                <span className="theme-card-desc">{t(`appearance.theme.${opt.id}.desc`)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3>
            <Database size={16} />
            {t('settings.scroll')}
          </h3>
          <p className="settings-info-text">{t('settings.scrollDesc')}</p>
          <div className="settings-page-size-row">
            {SCROLL_BATCH_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                className={`settings-page-size-btn ${scrollBatchSize === size ? 'active' : ''}`}
                disabled={busy}
                onClick={() => {
                  void onScrollBatchSizeChange(size);
                  showSuccess(t('settings.scrollApplied', { size }));
                }}
              >
                {size}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3>
            <Keyboard size={16} />
            {t('settings.shortcuts')}
          </h3>
          <p className="settings-info-text">{t('settings.shortcutsDesc')}</p>
          <table className="settings-shortcuts-table">
            <thead>
              <tr>
                <th>{t('settings.shortcutCol')}</th>
                <th>{t('settings.functionCol')}</th>
              </tr>
            </thead>
            <tbody>
              {SHORTCUT_ROWS.map((item) => (
                <tr key={item.keys}>
                  <td>
                    <kbd className="settings-kbd">{item.keys}</kbd>
                  </td>
                  <td>{t(item.labelKey)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="settings-section">
          <h3>
            <HardDrive size={16} />
            {t('settings.storage')}
          </h3>
          <p className="settings-info-text">
            {t('settings.storageDesc', { dbName: SQLITE_DB_NAME })}
          </p>
          {info && (
            <ul className="settings-stats">
              <li>
                <span>{t('settings.dataLocation')}</span>
                <code className="settings-path">{info.dataPath}</code>
              </li>
              <li>
                <span>{t('settings.databaseFile')}</span>
                <code className="settings-path">{info.databasePath}</code>
              </li>
              <li>
                <span>{t('settings.notesTodos')}</span>
                <strong>
                  {info.notesCount} / {info.kanbanCardsCount}
                </strong>
              </li>
              <li>
                <span>{t('settings.imagesFiles')}</span>
                <strong>
                  {info.imagesCount} / {info.attachmentsCount}
                </strong>
              </li>
              <li>
                <span>{t('settings.approxSize')}</span>
                <strong>{formatBytes(info.totalBytes)}</strong>
              </li>
            </ul>
          )}

          <div className="settings-actions settings-folder-actions">
            <button type="button" className="settings-btn" disabled={busy} onClick={() => openFolder('data')}>
              <FolderOpen size={16} />
              {t('settings.openDataFolder')}
            </button>
            <button type="button" className="settings-btn" disabled={busy} onClick={() => openFolder('images')}>
              <Image size={16} />
              {t('settings.imagesFolder')}
            </button>
            <button
              type="button"
              className="settings-btn"
              disabled={busy}
              onClick={() => openFolder('attachments')}
            >
              <Paperclip size={16} />
              {t('settings.attachmentsFolder')}
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h3>{t('settings.manageFiles')}</h3>
          <p className="settings-info-text">{t('settings.manageFilesDesc')}</p>

          <div className="settings-file-tabs">
            <button
              type="button"
              className={`settings-file-tab ${fileTab === 'image' ? 'active' : ''}`}
              onClick={() => setFileTab('image')}
            >
              <Image size={14} />
              {t('settings.imagesTab')} ({imageCount})
            </button>
            <button
              type="button"
              className={`settings-file-tab ${fileTab === 'attachment' ? 'active' : ''}`}
              onClick={() => setFileTab('attachment')}
            >
              <Paperclip size={14} />
              {t('settings.attachmentsTab')} ({attachmentCount})
            </button>
          </div>

          <div className="settings-file-toolbar">
            {(inventory?.unusedCount ?? 0) > 0 && (
              <button
                type="button"
                className="settings-btn settings-btn-danger"
                disabled={busy}
                onClick={() => void handleDeleteUnused()}
              >
                <Trash2 size={16} />
                {t('settings.deleteUnused', { count: inventory?.unusedCount ?? 0 })}
              </button>
            )}
            <button
              type="button"
              className="settings-btn settings-btn-danger"
              disabled={busy || selectedInTab.length === 0}
              onClick={() => void handleBulkDeleteSelected()}
            >
              <Trash2 size={16} />
              {t('settings.deleteSelected', { count: selectedInTab.length })}
            </button>
          </div>

          <div className="settings-file-list">
            {tabFiles.length === 0 ? (
              <p className="settings-file-empty">{t('settings.noFiles')}</p>
            ) : (
              <>
                <label className="settings-file-row settings-file-row--select-all">
                  <input
                    type="checkbox"
                    className="settings-file-checkbox"
                    checked={allTabSelected}
                    onChange={toggleSelectAllTab}
                    disabled={busy}
                  />
                  <span className="settings-file-select-all-label">{t('settings.selectAllTab')}</span>
                </label>
                {tabFiles.map((file) => {
                  const key = fileKey(file.fileId);
                  const displayName = file.originalName || file.fileName;
                  const checked = selectedKeys.has(key);
                  return (
                    <div
                      key={key}
                      className={`settings-file-row ${checked ? 'is-selected' : ''}`}
                    >
                      <label className="settings-file-row-select">
                        <input
                          type="checkbox"
                          className="settings-file-checkbox"
                          checked={checked}
                          disabled={busy}
                          onChange={() => toggleFileSelected(file.fileId)}
                        />
                        <div className="settings-file-row-body">
                          <div className="settings-file-row-main">
                            <span className="settings-file-name" title={displayName}>
                              {displayName}
                            </span>
                            <span className="settings-file-size">{formatBytes(file.size)}</span>
                          </div>
                          <p className="settings-file-status">
                            {file.used
                              ? t('settings.usedIn', {
                                  notes: `${file.usedInNotes.slice(0, 2).join(', ')}${file.usedInNotes.length > 2 ? ` +${file.usedInNotes.length - 2}` : ''}`,
                                })
                              : t('settings.unused')}
                          </p>
                        </div>
                      </label>
                      <button
                        type="button"
                        className="settings-file-delete"
                        disabled={busy}
                        title={t('settings.deleteFileTitle')}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteFile(file.fileId, displayName, file.used);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </section>

        <section className="settings-section">
          <h3>{t('settings.backup')}</h3>
          <p className="settings-info-text">{t('settings.backupDesc')}</p>
          <div className="settings-actions">
            <button type="button" className="settings-btn primary" disabled={busy} onClick={handleExport}>
              <Download size={16} />
              {t('settings.exportBackup')}
            </button>
            <button type="button" className="settings-btn" disabled={busy} onClick={handleRestore}>
              <Upload size={16} />
              {t('settings.restoreBackup')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
