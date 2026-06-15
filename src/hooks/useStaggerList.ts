import { useEffect, useRef, type RefObject } from 'react';
import type { JSAnimation } from 'animejs';
import { finishMotionReveal, staggerIn, type MotionPreset } from '../utils/motion';

export function useStaggerList(
  key: string,
  containerRef: RefObject<HTMLElement | null>,
  itemSelector: string,
  gapMs = 32,
  preset: MotionPreset = 'listItem'
) {
  const anim = useRef<JSAnimation | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    anim.current?.pause();
    anim.current = staggerIn(container, itemSelector, gapMs, preset);

    return () => {
      anim.current?.pause();
      container.querySelectorAll<HTMLElement>(itemSelector).forEach(finishMotionReveal);
    };
  }, [key, containerRef, itemSelector, gapMs, preset]);
}
