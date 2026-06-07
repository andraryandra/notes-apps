import { useEffect, type RefObject } from 'react';

/** Sematkan kelas pada ancestor saat scroll — tanpa re-render React. */
export function useListScrollClass(
  scrollRef: RefObject<HTMLElement | null>,
  ancestorSelector: string,
  className: string,
  idleMs = 180
) {
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const ancestor = scrollEl.closest(ancestorSelector);
    if (!ancestor) return;

    let timer: ReturnType<typeof setTimeout>;

    const onScroll = () => {
      ancestor.classList.add(className);
      clearTimeout(timer);
      timer = setTimeout(() => ancestor.classList.remove(className), idleMs);
    };

    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      ancestor.classList.remove(className);
    };
  }, [scrollRef, ancestorSelector, className, idleMs]);
}
