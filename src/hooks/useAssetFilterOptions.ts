import { useMemo } from 'react';
import {
  Image as ImageIcon,
  Paperclip,
  Link2,
  LayoutList,
} from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import type { AssetFilterOption, FileKindFilterOption } from '../utils/assetFilters';

export function useNoteAssetFilterOptions(): AssetFilterOption[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      { id: 'all', label: t('globalAssets.filterAll'), icon: LayoutList },
      { id: 'image', label: t('globalAssets.filterImages'), icon: ImageIcon },
      { id: 'file', label: t('globalAssets.filterFiles'), icon: Paperclip },
      { id: 'link', label: t('globalAssets.filterLinks'), icon: Link2 },
    ],
    [t]
  );
}

export function useFileKindFilterOptions(): FileKindFilterOption[] {
  const { t } = useI18n();
  return useMemo(
    () => [
      { id: 'all', label: t('globalAssets.fileKindAll') },
      { id: 'pdf', label: t('globalAssets.fileKindPdf') },
      { id: 'excel', label: t('globalAssets.fileKindExcel') },
      { id: 'word', label: t('globalAssets.fileKindWord') },
    ],
    [t]
  );
}
