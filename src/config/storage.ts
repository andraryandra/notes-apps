/** Konstanta penyimpanan & infinite scroll */

export const SCROLL_BATCH_SIZES = [15, 25, 50] as const;

export type ScrollBatchSize = (typeof SCROLL_BATCH_SIZES)[number];

export const DEFAULT_SCROLL_BATCH_SIZE: ScrollBatchSize = 25;

export function isScrollBatchSize(value: unknown): value is ScrollBatchSize {
  return typeof value === 'number' && (SCROLL_BATCH_SIZES as readonly number[]).includes(value);
}

export const SQLITE_DB_NAME = 'notes.db';
