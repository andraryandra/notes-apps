import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { DEFAULT_SCROLL_BATCH_SIZE } from '../config/storage';

export function useInfiniteScroll<T>(
  items: T[],
  batchSize: number = DEFAULT_SCROLL_BATCH_SIZE,
  scrollRootRef?: RefObject<HTMLElement | null>
) {
  const safeBatch = Math.max(5, Math.min(100, batchSize));
  const [visibleCount, setVisibleCount] = useState(safeBatch);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const itemsKey = items.length;

  useEffect(() => {
    setVisibleCount(safeBatch);
  }, [itemsKey, safeBatch]);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + safeBatch, items.length));
  }, [items.length, safeBatch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= items.length) return;

    const root = scrollRootRef?.current ?? null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root, rootMargin: '100px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, scrollRootRef, visibleCount, items.length]);

  const visible = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  return {
    visible,
    sentinelRef,
    hasMore,
    visibleCount,
    total: items.length,
  };
}
