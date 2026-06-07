import { useCallback, useEffect, useMemo, useState } from 'react';

export function usePagePagination<T>(items: T[], pageSize: number) {
  const safeSize = Math.max(5, Math.min(100, pageSize));
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / safeSize));

  useEffect(() => {
    setPage(0);
  }, [items.length, safeSize]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const slice = useMemo(() => {
    const start = page * safeSize;
    return items.slice(start, start + safeSize);
  }, [items, page, safeSize]);

  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goNext = useCallback(
    () => setPage((p) => Math.min(totalPages - 1, p + 1)),
    [totalPages]
  );

  return {
    page,
    pageSize: safeSize,
    totalItems: items.length,
    totalPages,
    slice,
    goPrev,
    goNext,
    setPage,
    hasPrev: page > 0,
    hasNext: page < totalPages - 1,
    rangeStart: items.length === 0 ? 0 : page * safeSize + 1,
    rangeEnd: Math.min(items.length, (page + 1) * safeSize),
  };
}
