import { useMemo } from 'react';
import { listNoteTemplates } from '../config/storage';
import { useI18n } from '../i18n/useI18n';
import './NoteTemplatePicker.css';

interface Props {
  onSelect: (templateId: string) => void;
  onClose: () => void;
}

export function NoteTemplatePicker({ onSelect, onClose }: Props) {
  const { t } = useI18n();
  const templates = useMemo(() => listNoteTemplates(), []);

  return (
    <div className="note-template-overlay" onClick={onClose}>
      <div className="note-template-picker" onClick={(e) => e.stopPropagation()}>
        <h3>{t('noteTemplates.pickTitle')}</h3>
        <ul className="note-template-list">
          {templates.map((tpl) => (
            <li key={tpl.id}>
              <button
                type="button"
                className="note-template-option"
                onClick={() => {
                  onSelect(tpl.id);
                  onClose();
                }}
              >
                <span className="note-template-option-title">{t(tpl.titleKey)}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="note-template-cancel" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
