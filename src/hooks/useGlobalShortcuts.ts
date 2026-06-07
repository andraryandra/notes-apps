import { useEffect, useRef } from 'react';
import { isModKey } from '../config/keyboardShortcuts';

interface Handlers {
  onNewNote: () => void;
  onFocusSearch: () => void;
  onOpenSettings: () => void;
  onTogglePin: () => void;
  onExportNote: () => void;
  onEscape: () => void;
  hasActiveNote: boolean;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

export function useGlobalShortcuts(handlers: Handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current;

      if (e.key === 'Escape') {
        h.onEscape();
        return;
      }

      if (!isModKey(e)) return;

      const typing = isTypingTarget(e.target);

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        h.onFocusSearch();
        return;
      }

      if (e.key === ',') {
        e.preventDefault();
        h.onOpenSettings();
        return;
      }

      if (typing) return;

      if (e.key === 'n' || e.key === 'N') {
        if (e.shiftKey) return;
        e.preventDefault();
        h.onNewNote();
        return;
      }

      if (e.shiftKey && (e.key === 'p' || e.key === 'P') && h.hasActiveNote) {
        e.preventDefault();
        h.onTogglePin();
        return;
      }

      if (e.shiftKey && (e.key === 'e' || e.key === 'E') && h.hasActiveNote) {
        e.preventDefault();
        h.onExportNote();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
