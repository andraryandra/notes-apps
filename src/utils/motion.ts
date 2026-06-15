import { animate, stagger, type JSAnimation } from 'animejs';
import type { AppLayoutMode, AppTheme } from '../config/appearance';
import type { SidebarMode } from '../config/appearance';

const EASE_OUT = 'outCubic';
const EASE_IN = 'inCubic';

export type MotionPreset =
  | 'fade'
  | 'flyoutPanel'
  | 'dialog'
  | 'toast'
  | 'viewPanel'
  | 'listItem'
  | 'card'
  | 'tooltip'
  | 'navSpring';

export const STAGGER_LIST_CAP = 24;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function motionMs(ms: number): number {
  return prefersReducedMotion() ? 1 : ms;
}

function clearMotionStyle(el: HTMLElement) {
  el.style.opacity = '';
  el.style.transform = '';
  el.style.scale = '';
}

/** Hapus state awal animasi — inline style + class opacity 0 */
export function finishMotionReveal(el: HTMLElement) {
  clearMotionStyle(el);
  el.classList.remove('motion-from-hidden');
}

export function isCyberpunkTheme(theme: AppTheme): boolean {
  return theme === 'cyberpunk' || theme === 'cyberday';
}

export function motionEnter(preset: MotionPreset, el: HTMLElement): JSAnimation | null {
  if (prefersReducedMotion()) {
    finishMotionReveal(el);
    return null;
  }

  const done = { onComplete: () => finishMotionReveal(el) };

  switch (preset) {
    case 'fade':
      return animate(el, {
        opacity: { from: 0, to: 1 },
        duration: motionMs(200),
        ease: EASE_OUT,
        ...done,
      });
    case 'flyoutPanel':
      return animate(el, {
        opacity: { from: 0, to: 1 },
        translateX: { from: -18, to: 0 },
        duration: motionMs(260),
        ease: EASE_OUT,
        ...done,
      });
    case 'dialog':
      return animate(el, {
        opacity: { from: 0, to: 1 },
        translateY: { from: 10, to: 0 },
        scale: { from: 0.97, to: 1 },
        duration: motionMs(280),
        ease: 'outBack(1.35)',
        ...done,
      });
    case 'toast':
      return animate(el, {
        opacity: { from: 0, to: 1 },
        translateY: { from: 14, to: 0 },
        duration: motionMs(300),
        ease: EASE_OUT,
        ...done,
      });
    case 'viewPanel':
      return animate(el, {
        opacity: { from: 0, to: 1 },
        translateX: { from: 8, to: 0 },
        duration: motionMs(240),
        ease: EASE_OUT,
        ...done,
      });
    case 'listItem':
      return animate(el, {
        opacity: { from: 0, to: 1 },
        translateY: { from: 6, to: 0 },
        duration: motionMs(200),
        ease: EASE_OUT,
        ...done,
      });
    case 'card':
      return animate(el, {
        opacity: { from: 0, to: 1 },
        scale: { from: 0.98, to: 1 },
        duration: motionMs(220),
        ease: EASE_OUT,
        ...done,
      });
    case 'tooltip':
      return animate(el, {
        opacity: { from: 0, to: 1 },
        translateX: { from: -6, to: 0 },
        duration: motionMs(140),
        ease: EASE_OUT,
        ...done,
      });
    case 'navSpring':
      return animate(el, {
        scale: { from: 0.92, to: 1 },
        opacity: { from: 0.7, to: 1 },
        duration: motionMs(280),
        ease: 'outBack(1.3)',
        ...done,
      });
    default:
      finishMotionReveal(el);
      return null;
  }
}

export function motionExit(
  preset: MotionPreset,
  el: HTMLElement,
  onComplete: () => void
): JSAnimation | null {
  if (prefersReducedMotion()) {
    onComplete();
    return null;
  }

  const done = { duration: motionMs(180), ease: EASE_IN, onComplete };

  switch (preset) {
    case 'fade':
      return animate(el, { opacity: { to: 0 }, ...done });
    case 'flyoutPanel':
      return animate(el, {
        opacity: { to: 0 },
        translateX: { to: -14 },
        ...done,
      });
    case 'dialog':
      return animate(el, {
        opacity: { to: 0 },
        translateY: { to: 6 },
        scale: { to: 0.98 },
        ...done,
      });
    case 'toast':
      return animate(el, {
        opacity: { to: 0 },
        translateY: { to: 8 },
        ...done,
      });
    case 'viewPanel':
      return animate(el, {
        opacity: { to: 0 },
        translateX: { to: -8 },
        ...done,
      });
    case 'listItem':
      return animate(el, {
        opacity: { to: 0 },
        translateY: { to: 4 },
        ...done,
      });
    case 'card':
      return animate(el, {
        opacity: { to: 0 },
        scale: { to: 0.97 },
        ...done,
      });
    case 'tooltip':
      return animate(el, {
        opacity: { to: 0 },
        translateX: { to: -4 },
        duration: motionMs(100),
        ease: EASE_IN,
        onComplete,
      });
    case 'navSpring':
      return animate(el, {
        opacity: { to: 0 },
        scale: { to: 0.9 },
        ...done,
      });
    default:
      onComplete();
      return null;
  }
}

/** Stagger masuk untuk kumpulan tombol (mis. sidebar rail). */
export function staggerIn(
  container: HTMLElement,
  itemSelector: string,
  gapMs = 36,
  preset: MotionPreset = 'listItem'
): JSAnimation | null {
  const items = container.querySelectorAll<HTMLElement>(itemSelector);
  if (!items.length || prefersReducedMotion()) {
    items.forEach((el) => finishMotionReveal(el));
    return null;
  }

  const capped = [...items].slice(0, STAGGER_LIST_CAP);
  for (let i = STAGGER_LIST_CAP; i < items.length; i++) {
    finishMotionReveal(items[i]);
  }

  const revealAll = () => capped.forEach((el) => finishMotionReveal(el));

  if (preset === 'card') {
    return animate(capped, {
      opacity: { from: 0, to: 1 },
      scale: { from: 0.98, to: 1 },
      delay: stagger(gapMs),
      duration: motionMs(200),
      ease: EASE_OUT,
      onComplete: revealAll,
    });
  }

  return animate(capped, {
    opacity: { from: 0, to: 1 },
    translateY: { from: 5, to: 0 },
    delay: stagger(gapMs),
    duration: motionMs(180),
    ease: EASE_OUT,
    onComplete: revealAll,
  });
}

let themeOverlayEl: HTMLDivElement | null = null;

function getThemeOverlay(): HTMLDivElement {
  if (!themeOverlayEl) {
    themeOverlayEl = document.createElement('div');
    themeOverlayEl.className = 'theme-crossfade-overlay';
    themeOverlayEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(themeOverlayEl);
  }
  return themeOverlayEl;
}

/** Crossfade halus saat ganti tema. */
export function animateThemeChange(onMidpoint: () => void): Promise<void> {
  if (prefersReducedMotion()) {
    onMidpoint();
    return Promise.resolve();
  }

  const overlay = getThemeOverlay();

  return new Promise((resolve) => {
    animate(overlay, {
      opacity: { from: 0, to: 1 },
      duration: motionMs(160),
      ease: EASE_IN,
      onComplete: () => {
        onMidpoint();
        animate(overlay, {
          opacity: { to: 0 },
          duration: motionMs(220),
          ease: EASE_OUT,
          onComplete: () => resolve(),
        });
      },
    });
  });
}

/** Pulse glow halus untuk tema cyberpunk. */
export function startCyberpunkPulse(el: HTMLElement): JSAnimation | null {
  if (prefersReducedMotion()) return null;
  return animate(el, {
    opacity: { from: 0.88, to: 1 },
    duration: motionMs(4000),
    ease: 'inOutSine',
    alternate: true,
    loop: true,
  });
}

export function expandedSidebarWidthPx(layout: AppLayoutMode): number {
  if (layout === 'wide') return 220;
  if (layout === 'compact') return 228;
  return 260;
}

export function sidebarWidthPx(layout: AppLayoutMode, mode: SidebarMode): number {
  return mode === 'rail' ? 64 : expandedSidebarWidthPx(layout);
}

/** Animasi lebar sidebar saat ganti mode penuh ↔ ikon. */
export function animateSidebarWidth(
  layout: AppLayoutMode,
  mode: SidebarMode
): Promise<void> {
  const root = document.documentElement;
  const target = sidebarWidthPx(layout, mode);
  const current = parseFloat(getComputedStyle(root).getPropertyValue('--sidebar-width')) || target;

  if (Math.abs(current - target) < 1) {
    return Promise.resolve();
  }

  root.style.setProperty('--sidebar-width', `${current}px`);

  return new Promise((resolve) => {
    const finish = () => {
      root.style.removeProperty('--sidebar-width');
      resolve();
    };

    if (prefersReducedMotion()) {
      finish();
      return;
    }

    animate(root, {
      '--sidebar-width': { from: `${current}px`, to: `${target}px` },
      duration: motionMs(300),
      ease: EASE_OUT,
      onComplete: finish,
    });
  });
}
