import { Search, X } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import './GlobalSearch.css';

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GlobalSearch({ value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <div className="global-search">
      <Search size={16} className="global-search-icon" />
      <input
        id="global-search-input"
        type="text"
        placeholder={t('globalSearch.placeholder')}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="global-search-input"
      />
      {value && (
        <button type="button" className="global-search-clear" onClick={() => onChange('')}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
