import { createContext, useMemo, type ReactNode } from 'react';
import type { AppLocale } from '../config/appearance';
import { createTranslator, type TranslateFn } from './translator';

export const I18nContext = createContext<{
  locale: AppLocale;
  timeZone: string;
  t: TranslateFn;
} | null>(null);

export function I18nProvider({
  locale,
  timeZone,
  children,
}: {
  locale: AppLocale;
  timeZone: string;
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const t = createTranslator(locale);
    document.documentElement.lang = locale === 'id' ? 'id' : 'en';
    return { locale, timeZone, t };
  }, [locale, timeZone]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
