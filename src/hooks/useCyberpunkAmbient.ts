import { useEffect, useRef, type RefObject } from 'react';
import type { JSAnimation } from 'animejs';
import { prefersReducedMotion, startCyberpunkPulse } from '../utils/motion';

/** Loop ambient halus pada elemen sidebar — hanya saat enabled & tab aktif. */
export function useCyberpunkAmbient(
  enabled: boolean,
  targetRef: RefObject<HTMLElement | null>,
  paused: boolean
) {
  const anim = useRef<JSAnimation | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    anim.current?.pause();
    anim.current = null;

    if (!enabled || !el || paused || prefersReducedMotion() || document.hidden) {
      return;
    }

    anim.current = startCyberpunkPulse(el);

    const onVis = () => {
      if (document.hidden) {
        anim.current?.pause();
      } else if (enabled && !paused && el) {
        anim.current?.pause();
        anim.current = startCyberpunkPulse(el);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      anim.current?.pause();
    };
  }, [enabled, paused, targetRef]);
}
