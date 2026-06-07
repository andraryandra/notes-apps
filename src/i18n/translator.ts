import type { AppLocale } from '../config/appearance';
import { en } from './locales/en';
import { id, type TranslationTree } from './locales/id';

const LOCALES: Record<AppLocale, TranslationTree> = { id, en };

export type TranslateParams = Record<string, string | number>;

function getNested(obj: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === 'string' ? cur : undefined;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    params[key] != null ? String(params[key]) : `{{${key}}}`
  );
}

export function createTranslator(locale: AppLocale) {
  const dict = LOCALES[locale] ?? LOCALES.id;
  const fallback = LOCALES.id;

  return function t(key: string, params?: TranslateParams): string {
    const raw = getNested(dict, key) ?? getNested(fallback, key) ?? key;
    return interpolate(raw, params);
  };
}

export type TranslateFn = ReturnType<typeof createTranslator>;
