"use client";

import { useId } from "react";
import { cn } from "./cn";
import { IconButton } from "./button";
import { useModalDialog } from "./use-modal-dialog";

/** Panel width at the explorer breakpoint and above. Below it the dialog is full-screen. */
export type DialogSize = "md" | "lg";

const panelWidths: Record<DialogSize, string> = {
  md: "explorer:w-[min(760px,100%)]", // forms and confirmations
  lg: "explorer:w-[min(1060px,100%)]", // content detail
};

/**
 * Accessible modal dialog built on the native <dialog> element.
 *
 * Semantics, focus containment, Escape and focus restoration come from
 * `showModal()` — see use-modal-dialog.ts. This component adds the reference's
 * composition on top: a dark titled header, a body that scrolls on its own so
 * long content never scrolls the page behind it, an optional footer, and the
 * full-screen treatment the reference switches to below 900px.
 *
 * The dialog is presentation only. It holds no product state, grants no
 * authority, and leaves routing to its caller.
 */
export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  lede,
  size = "md",
  closeLabel = "Cerrar",
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  lede?: string;
  size?: DialogSize;
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
    className={cn(
      // Filling the viewport lets the element be both the scrim and the layout
      // box for the panel, which is what makes "click outside" a plain target
      // check instead of geometry maths.
      "fixed inset-0 m-0 h-auto max-h-none w-auto max-w-none items-stretch justify-center overflow-hidden bg-scrim p-0 backdrop-blur-[3px]",
      "open:flex open:animate-scrim-in explorer:items-center explorer:p-8",
    )}
  >
    <div
      ref={panelRef}
      tabIndex={-1}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden bg-inset text-start shadow-overlay outline-none animate-panel-in",
        "explorer:h-auto explorer:max-h-[calc(100dvh-4rem)] explorer:rounded-2xl",
        panelWidths[size],
        className,
      )}
    >
      <header className="relative flex-none overflow-hidden bg-night px-6 py-5 text-white explorer:px-7 explorer:py-6">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(90%_160%_at_85%_-40%,#111e6b_0%,transparent_60%)]" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && <p className="text-meta font-bold uppercase text-accent">{eyebrow}</p>}
            <h2 id={titleId} className={cn("text-panel font-extrabold", eyebrow && "mt-2")}>{title}</h2>
          </div>
          <IconButton label={closeLabel} tone="on-dark" onClick={() => dialogRef.current?.close()}>✕</IconButton>
        </div>
        {lede && <p className="mt-3 max-w-2xl text-body text-white/70">{lede}</p>}
      </header>

      {/* The only scroll container inside the dialog: the page behind stays put. */}
      <div className="flex-1 overflow-y-auto px-6 py-6 explorer:px-7">{open && children}</div>

      {footer && <div className="flex-none border-t border-hairline bg-surface px-6 py-4 explorer:px-7">{footer}</div>}
    </div>
  </dialog>;
}
