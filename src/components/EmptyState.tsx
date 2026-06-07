import type { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import './EmptyState.css';

interface Props {
  title?: string;
  description?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, description, icon }: Props) {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon ?? <FileText size={48} strokeWidth={1.2} />}
      </div>
      <h2>{title ?? t('empty.title')}</h2>
      <p>{description ?? t('empty.description')}</p>
    </div>
  );
}
