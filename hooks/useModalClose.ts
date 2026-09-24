"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Keep in step with the modalBackdropOut / modalCardOut duration in globals.css.
export const MODAL_CLOSE_MS = 200;

/**
 * For a modal that its parent mounts conditionally (`{open && <Modal onClose />}`).
 * `close()` flips `closing` first so the exit animation plays, then calls the
 * parent's `onClose` once it's done. Put `data-state={closing ? "closing" : "open"}`
 * on the `.modal-backdrop` element.
 */
export function useModalClose(onClose: () => void) {
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(onClose);
  latest.current = onClose;

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const close = useCallback(() => {
    if (timer.current) return;
    setClosing(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      latest.current();
    }, MODAL_CLOSE_MS);
  }, []);

  return { closing, close };
}

/**
 * For a modal driven by an `open` prop: keeps it mounted for MODAL_CLOSE_MS
 * after `open` turns false so the exit animation can run.
 */
export function useModalPresence(open: boolean) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return; }
    if (!mounted) return;
    setClosing(true);
    const id = setTimeout(() => { setMounted(false); setClosing(false); }, MODAL_CLOSE_MS);
    return () => clearTimeout(id);
  }, [open, mounted]);

  return { mounted: open || mounted, closing: closing && !open };
}

/**
 * For a modal whose content hangs off a state value (`const [modal, setModal]`,
 * rendered as `{modal && …}`): returns the last non-null value for
 * MODAL_CLOSE_MS after it becomes null/false so the exit animation can run.
 */
export function useHeldValue<T>(value: T | null | undefined | false) {
  const [held, setHeld] = useState<T | null>(value || null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (value) { setHeld(value); setClosing(false); return; }
    if (!held) return;
    setClosing(true);
    const id = setTimeout(() => { setHeld(null); setClosing(false); }, MODAL_CLOSE_MS);
    return () => clearTimeout(id);
  }, [value, held]);

  return { value: (value || held) as T | null, closing: closing && !value };
}
