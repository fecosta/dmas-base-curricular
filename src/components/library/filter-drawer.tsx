"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";

const PANEL_ID = "panel-de-filtros";

/** Mirrors --breakpoint-explorer. Above it the desktop column is back, so the drawer closes itself. */
const EXPLORER = "(min-width: 56.25rem)";

/**
 * The narrow-width filter interaction: the same filter controls, in the
 * reference's left drawer, behind a trigger in the results header.
 *
 * `children` are the server-rendered filter groups — the identical links the
 * desktop panel renders. There is no second filter model here, and no state
 * beyond whether the drawer is open: choosing a value navigates, the server
 * re-renders the groups, and the drawer stays open so several dimensions can be
 * set in one pass. Escape, focus containment, focus restoration and background
 * scroll lock come from the Phase 1 Drawer, which is a native modal <dialog>.
 */
export function LibraryFilterDrawer({ activeCount, children, footer }: {
  activeCount: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  // Growing past the breakpoint hides the trigger, so leaving the drawer open
  // there would strand it next to the column it stands in for.
  useEffect(() => {
    const wide = window.matchMedia(EXPLORER);
    const sync = () => { if (wide.matches) setOpen(false); };
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);

  return <>
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls={PANEL_ID}
      className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-4 py-2 text-control font-bold text-ink-soft explorer:hidden"
    >
      Filtros
      {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-meta font-bold tracking-normal text-white">{activeCount}</span>}
    </button>

    <Drawer id={PANEL_ID} open={open} onClose={() => setOpen(false)} title="Filtros" side="start" className="bg-surface" footer={footer}>
      {/* Negative gutters: the groups carry the panel's own 16px padding. */}
      <div className="-mx-4 -my-4">{children}</div>
    </Drawer>
  </>;
}
