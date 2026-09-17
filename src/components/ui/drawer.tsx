"use client";

import { useId } from "react";
import { cn } from "./cn";
import { IconButton } from "./button";
import { useModalDialog } from "./use-modal-dialog";

/** Edge the panel is anchored to. Both sides have a caller in the reference. */
export type DrawerSide = "start" | "end";

/** Surface treatment. The reference's navigation sheet is a dark band; its filter panel is not. */
export type DrawerTone = "light" | "dark";

const tones: Record<DrawerTone, { panel: string; header: string; title: string }> = {
  light: { panel: "bg-inset", header: "border-hairline bg-surface", title: "text-ink" },
  dark: { panel: "on-dark bg-night-deep text-white", header: "border-white/12 bg-white/5", title: "text-white" },
};

/**
 * Accessible edge-anchored modal drawer, built on the same native <dialog>
 * foundation as Dialog (see use-modal-dialog.ts) so both share one set of
 * semantics, focus and scroll-lock behaviour.
 *
 * The reference uses both edges: its compact navigation sheet slides in from the
 * right below 1180px, and its filter panel slides in from the left below 900px.
 * "start" stays the default because the filter panel is the wider use.
 *
 * Moving the Library filter form into it is Phase 3.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "start",
  tone = "light",
  id,
  closeLabel = "Cerrar",
  footer,
  className,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: DrawerSide;
  tone?: DrawerTone;
  /** Lets a trigger point at the panel with aria-controls. */
  id?: string;
  closeLabel?: string;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const titleId = useId();
  const { dialogRef, panelRef, handleClose, handleBackdropClick } = useModalDialog(open, onClose);

  return <dialog
    ref={dialogRef}
    id={id}
    aria-labelledby={titleId}
    onClose={handleClose}
    onClick={handleBackdropClick}
    className={cn(
      "fixed inset-0 m-0 h-auto max-h-none w-auto max-w-none items-stretch overflow-hidden bg-scrim p-0 backdrop-blur-[3px] open:flex open:animate-scrim-in",
      side === "start" ? "justify-start" : "justify-end",
    )}
  >
    <div
      ref={panelRef}
      tabIndex={-1}
      className={cn(
        // Viewport height with its own scroll container: a long filter list
        // scrolls inside the drawer, never the page behind it.
        "flex h-dvh w-[min(330px,88vw)] flex-col text-start outline-none",
        tones[tone].panel,
        side === "start" ? "shadow-drawer animate-drawer-in" : "shadow-drawer-end animate-drawer-end-in",
        className,
      )}
    >
      <header className={cn("flex flex-none items-center justify-between gap-3 border-b px-4 py-3", tones[tone].header)}>
        <h2 id={titleId} className={cn("text-control font-extrabold", tones[tone].title)}>{title}</h2>
        <IconButton label={closeLabel} compact tone={tone === "dark" ? "on-dark" : "light"} onClick={() => dialogRef.current?.close()}>✕</IconButton>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">{open && children}</div>

      {footer && <div className={cn("flex-none border-t px-4 py-3", tones[tone].header)}>{footer}</div>}
    </div>
  </dialog>;
}
