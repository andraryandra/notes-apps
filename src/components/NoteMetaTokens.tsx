import { Calendar, CheckSquare } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import './NoteMetaTokens.css';

interface Props {
  scheduledAt: number | null;
  todoCount: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function NoteMetaTokens({
  scheduledAt,
  todoCount,
  className = '',
  size = 'sm',
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();

  if (!scheduledAt && todoCount <= 0) return null;

  const scheduleToken = scheduledAt
    ? `${dt.formatDate(scheduledAt, { day: 'numeric', month: 'short' })} · ${dt.formatScheduleTime(scheduledAt)}`
    : '';

  return (
    <div className={`note-meta-tokens note-meta-tokens--${size} ${className}`.trim()}>
      {scheduledAt && (
        <span
          className="note-meta-token note-meta-token--schedule"
          title={t('noteMeta.scheduleTitle', {
            when: dt.formatDateTime(scheduledAt),
          })}
        >
          <Calendar size={size === 'md' ? 13 : 11} strokeWidth={2.25} aria-hidden />
          <span className="note-meta-token-text">
            {t('noteMeta.scheduleBadge')} · {scheduleToken}
          </span>
        </span>
      )}
      {todoCount > 0 && (
        <span
          className="note-meta-token note-meta-token--todo"
          title={
            todoCount === 1
              ? t('noteMeta.todoLinkedOne')
              : t('noteMeta.todoLinkedMany', { count: todoCount })
          }
        >
          <CheckSquare size={size === 'md' ? 13 : 11} strokeWidth={2.25} aria-hidden />
          <span className="note-meta-token-text">
            {todoCount === 1 ? t('noteMeta.tabTodo') : `${todoCount} ${t('noteMeta.tabTodo')}`}
          </span>
        </span>
      )}
    </div>
  );
}
