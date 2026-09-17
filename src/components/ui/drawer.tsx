"use client";

import { useId } from "react";
import { cn } from "./cn";
import { IconButton } from "./button";
import { useModalDialog } from "./use-modal-dialog";

/**
 * Accessible left-anchored modal drawer, built on the same native <dialog>
 * foundation as Dialog (see use-modal-dialog.ts) so both share one set of
 * semantics, focus and scroll-lock behaviour.
 *
 * It exists for the reference's compact filter panel, which slides in from the
 * left below 900px. Placement is left-only on purpose: that is the one position
 * the reference uses, and an unused right-hand branch would be an abstraction
 * without a caller.
 *
 * This is the primitive only. Moving the Library filter form into it is Phase 3.
 */
export function Drawer({
  open,
  onClose,
  title,
  closeLabel = "Cerrar",
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel?: string;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const { dialogRef, panelRef, handleClose, handleBackdropClick } = useModalDialog(open, onClose);

  return <dialog
    ref={dialogRef}
    aria-labelledby={titleId}
    onClose={handleClose}
    onClick={handleBackdropClick}
    className="fixed inset-0 m-0 h-auto max-h-none w-auto max-w-none items-stretch justify-start overflow-hidden bg-scrim p-0 backdrop-blur-[3px] open:flex open:animate-scrim-in"
  >
    <div
      ref={panelRef}
      tabIndex={-1}
      className={cn(
        // Viewport height with its own scroll container: a long filter list
        // scrolls inside the drawer, never the page behind it.
        "flex h-dvh w-[min(330px,88vw)] flex-col bg-inset text-start shadow-drawer outline-none animate-drawer-in",
        className,
      )}
    >
      <header className="flex flex-none items-center justify-between gap-3 border-b border-hairline bg-surface px-4 py-3">
        <h2 id={titleId} className="text-control font-extrabold text-ink">{title}</h2>
        <IconButton label={closeLabel} compact onClick={() => dialogRef.current?.close()}>✕</IconButton>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">{open && children}</div>

      {footer && <div className="flex-none border-t border-hairline bg-surface px-4 py-3">{footer}</div>}
    </div>
  </dialog>;
}
