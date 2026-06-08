import type { ConfirmOptions, ConfirmVariant } from '../context/ConfirmContext';

export type ConfirmState = ConfirmOptions & {
  id: number;
  variant: ConfirmVariant;
};

let state: ConfirmState | null = null;
let resolveRef: ((value: boolean) => void) | null = null;
let idSeq = 0;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeConfirm(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getConfirmState(): ConfirmState | null {
  return state;
}

export function requestConfirm(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    resolveRef = resolve;
    idSeq += 1;
    state = {
      ...options,
      id: idSeq,
      variant: options.variant ?? 'default',
    };
    // Tunda render ke frame berikutnya — hindari jank saat event click masih selesai
    requestAnimationFrame(() => emit());
  });
}

export function finishConfirm(result: boolean) {
  resolveRef?.(result);
  resolveRef = null;
  state = null;
  emit();
}
