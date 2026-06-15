import { useEffect, useRef } from 'react';
import { useCyberpunkAmbient } from '../hooks/useCyberpunkAmbient';

interface Props {
  enabled: boolean;
  paused: boolean;
}

/** Efek ambient halus pada sidebar — hanya tema cyberpunk. */
export function CyberpunkAmbient({ enabled, paused }: Props) {
  const sidebarRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    sidebarRef.current = document.querySelector('.sidebar');
  });

  useCyberpunkAmbient(enabled, sidebarRef, paused);

  return null;
}
