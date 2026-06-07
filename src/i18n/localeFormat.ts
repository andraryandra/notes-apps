import type { AppLocale } from '../config/appearance';

export function localeTag(locale: AppLocale): string {
  return locale === 'id' ? 'id-ID' : 'en-US';
}
