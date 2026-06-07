import { Minus, Square, X, Settings, PanelLeft } from 'lucide-react';
import { APP_LOCALES, type AppLocale } from '../config/appearance';
import { useI18n } from '../i18n/useI18n';
import './TitleBar.css';

interface Props {
  onOpenSettings?: () => void;
  showNoteListToggle?: boolean;
  noteListOpen?: boolean;
  onToggleNoteList?: () => void;
  locale?: AppLocale;
  onLocaleChange?: (locale: AppLocale) => void;
}

function LocaleSwitcher({
  locale,
  onLocaleChange,
}: {
  locale: AppLocale;
  onLocaleChange: (locale: AppLocale) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="titlebar-locale" role="group" aria-label={t('titleBar.language')}>
      {APP_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          className={`titlebar-locale-btn ${locale === loc ? 'active' : ''}`}
          aria-pressed={locale === loc}
          title={loc === 'id' ? t('titleBar.switchToId') : t('titleBar.switchToEn')}
          onClick={() => {
            if (loc !== locale) onLocaleChange(loc);
          }}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function TitleBar({
  onOpenSettings,
  showNoteListToggle,
  noteListOpen,
  onToggleNoteList,
  locale,
  onLocaleChange,
}: Props) {
  const { t } = useI18n();
  const showWindowControls = window.electronAPI?.platform === 'darwin';

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <span className="titlebar-logo">✦</span>
        <span className="titlebar-title">Notes</span>
      </div>
      <div className="titlebar-right">
        {showNoteListToggle && onToggleNoteList && (
          <button
            type="button"
            className={`titlebar-btn ${noteListOpen ? 'active' : ''}`}
            title={t('titleBar.noteList')}
            onClick={onToggleNoteList}
          >
            <PanelLeft size={16} />
          </button>
        )}
        {locale && onLocaleChange && (
          <LocaleSwitcher locale={locale} onLocaleChange={onLocaleChange} />
        )}
        {onOpenSettings && (
          <button
            type="button"
            className="titlebar-btn titlebar-settings"
            title={t('titleBar.settings')}
            onClick={onOpenSettings}
          >
            <Settings size={16} />
          </button>
        )}
        {showWindowControls && (
          <div className="titlebar-controls">
            <button className="titlebar-btn" title="Minimize" type="button">
              <Minus size={14} />
            </button>
            <button className="titlebar-btn" title="Maximize" type="button">
              <Square size={12} />
            </button>
            <button className="titlebar-btn titlebar-btn-close" title="Close" type="button">
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
