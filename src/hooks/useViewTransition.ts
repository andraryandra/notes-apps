import { useEffect, useRef, type RefObject } from 'react';
import type { JSAnimation } from 'animejs';
import { finishMotionReveal, motionEnter } from '../utils/motion';

/** Animasi masuk saat key berubah (mis. ganti catatan). */
export function useViewTransition<T extends HTMLElement>(
  activeKey: string | number | null | undefined
): { ref: RefObject<T>; motionKey: string } {
  const ref = useRef<T>(null);
  const anim = useRef<JSAnimation | null>(null);
  const motionKey = String(activeKey ?? 'empty');

  useEffect(() => {
    const el = ref.current;
    if (!el || activeKey == null) return;

    el.classList.add('motion-from-hidden');
    anim.current?.pause();
    anim.current = motionEnter('viewPanel', el);

    return () => {
      anim.current?.pause();
      if (el) finishMotionReveal(el);
    };
  }, [motionKey, activeKey]);

  return { ref, motionKey };
}
