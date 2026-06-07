import type { Tag } from '../types';
import './NoteTagChips.css';

interface Props {
  tags: Tag[];
  tagIds: string[];
  className?: string;
  size?: 'sm' | 'md';
}

export function NoteTagChips({ tags, tagIds, className = '', size = 'sm' }: Props) {
  const noteTags = tags.filter((t) => tagIds.includes(t.id));
  if (noteTags.length === 0) return null;

  return (
    <div className={`note-tag-chips note-tag-chips--${size} ${className}`.trim()}>
      {noteTags.map((t) => (
        <span
          key={t.id}
          className="note-tag-chip"
          style={{ borderColor: t.color, color: t.color }}
          title={t.name}
        >
          <span className="note-tag-chip-dot" style={{ background: t.color }} aria-hidden />
          {t.name}
        </span>
      ))}
    </div>
  );
}
