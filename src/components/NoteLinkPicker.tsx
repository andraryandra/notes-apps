import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Note } from '../types';
import { filterActiveNotes } from '../utils/trashFilter';
import { buildNoteLink } from '../utils/noteLinks';
import { useI18n } from '../i18n/useI18n';
import './NoteLinkPicker.css';

interface Props {
  notes: Note[];
  onSelect: (href: string, label: string) => void;
  onClose: () => void;
}

export function NoteLinkPicker({ notes, onSelect, onClose }: Props) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterActiveNotes(notes)
      .filter((n) => {
        if (!q) return true;
        const title = n.title.toLowerCase();
        const preview = (n.contentPreview ?? '').toLowerCase();
        return title.includes(q) || preview.includes(q);
      })
      .slice(0, 40);
  }, [notes, query]);

  return (
    <div className="note-link-overlay" onClick={onClose}>
      <div className="note-link-picker" onClick={(e) => e.stopPropagation()}>
        <h3>{t('noteLinks.pickTitle')}</h3>
        <div className="note-link-search">
          <Search size={16} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('noteLinks.searchPlaceholder')}
            autoFocus
          />
        </div>
        <ul className="note-link-list">
          {options.length === 0 ? (
            <li className="note-link-empty">{t('noteLinks.empty')}</li>
          ) : (
            options.map((note) => {
              const label = note.title.trim() || t('noteList.untitled');
              return (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(buildNoteLink(note.id), label);
                      onClose();
                    }}
                  >
                    {label}
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <button type="button" className="note-link-cancel" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
