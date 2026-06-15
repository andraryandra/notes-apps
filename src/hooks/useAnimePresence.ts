import { useEffect, useRef, useState, type RefObject } from 'react';
import type { JSAnimation } from 'animejs';
import { motionEnter, motionExit, type MotionPreset } from '../utils/motion';

/**
 * Mount/unmount dengan animasi masuk & keluar (anime.js).
 * `open=false` memicu exit lalu unmount setelah selesai.
 */
export function useAnimePresence<T extends HTMLElement>(
  open: boolean,
  preset: MotionPreset
): { mounted: boolean; ref: RefObject<T> } {
  const [mounted, setMounted] = useState(open);
  const ref = useRef<T>(null);
  const anim = useRef<JSAnimation | null>(null);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!mounted || !el) return;

    anim.current?.pause();

    if (open) {
      anim.current = motionEnter(preset, el);
    } else {
      const out = motionExit(preset, el, () => setMounted(false));
      anim.current = out;
      if (!out) setMounted(false);
    }

    return () => {
      anim.current?.pause();
    };
  }, [open, mounted, preset]);

  return { mounted, ref };
}
