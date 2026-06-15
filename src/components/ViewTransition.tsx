import { useEffect, useRef, type ReactNode } from 'react';
import { finishMotionReveal, motionEnter } from '../utils/motion';
import type { JSAnimation } from 'animejs';

interface Props {
  viewKey: string;
  className?: string;
  children: ReactNode;
}

/** Bungkus panel utama — animasi masuk saat viewKey / mount berubah. */
export function ViewTransition({ viewKey, className, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<JSAnimation | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.classList.add('motion-from-hidden');
    anim.current?.pause();
    anim.current = motionEnter('viewPanel', el);

    return () => {
      anim.current?.pause();
      finishMotionReveal(el);
    };
  }, [viewKey]);

  return (
    <div ref={ref} className={`view-transition ${className ?? ''}`.trim()}>
      {children}
    </div>
  );
}
