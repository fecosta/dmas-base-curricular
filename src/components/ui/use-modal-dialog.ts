"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Drives a native <dialog> from React state.
 *
 * `showModal()` is the platform's own modal implementation, and it already
 * supplies the behaviour this repository would otherwise hand-roll: focus
 * containment, Escape dismissal, the top layer (so no z-index or portal
 * bookkeeping), inert background content, and focus restoration on close.
 * Reaching for a focus-trap or overlay dependency would buy less than it costs.
 *
 * Two things the platform deliberately leaves open are handled here and in
 * globals.css: where focus should land on open (the labelled panel, not the
 * dismiss button), and background scroll lock (`html:has(dialog[open])`).
 */
export function useModalDialog(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      // showModal() throws if the dialog is already open.
      if (dialog.open) return;
      restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      // Left alone, showModal() focuses the first focusable descendant, which is
      // the close button. Focusing the panel instead means assistive technology
      // announces the dialog's own name rather than "Cerrar".
      panelRef.current?.focus();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  // An overlay unmounted while open would leave the top layer — and the scroll
  // lock that keys off dialog[open] — behind.
  useEffect(() => () => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
  }, []);

  /**
   * Every close route converges here: Escape, the close button, a backdrop
   * click, and the parent setting `open` to false. React state stays the single
   * source of truth for whether the overlay is open.
   */
  const handleClose = useCallback(() => {
    onClose();
    // Browsers return focus to the invoker themselves. Only step in when one
    // has dropped focus to the document instead.
    if (document.activeElement === document.body) restoreRef.current?.focus();
  }, [onClose]);

  /**
   * The <dialog> element is the full-viewport scrim and lays out the panel, so
   * a click that lands on the element itself landed outside the panel.
   */
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) dialogRef.current?.close();
  }, []);

  return { dialogRef, panelRef, handleClose, handleBackdropClick };
}
