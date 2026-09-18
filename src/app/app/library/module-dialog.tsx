"use client";

import { usePathname, useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/dialog";
import { isModuleDetailPath } from "@/lib/ui/nav";

/**
 * The overlay shell around a contextually opened module.
 *
 * One rule holds the whole thing together: the overlay is up exactly while the
 * address bar holds a module route. Both halves of that matter.
 *
 * Reading it from the URL is what closes the panel when the reader follows a
 * link out of it — to a Material, say. A parallel slot keeps its content across
 * a client-side navigation rather than falling back, so an overlay that assumed
 * it was open would be left covering the page the reader had moved on to.
 *
 * Writing it back to the URL is what makes dismissal a navigation rather than
 * local state. Every route the Phase 1 Dialog can be closed by — the close
 * control, Escape, a click on the scrim — arrives at `onClose`, and unwinding
 * the history entry that opened the module returns the reader to the exact
 * Library URL they came from, with the search, filters and view they had
 * applied. It also follows, with no history bookkeeping of its own, that browser
 * Back closes the overlay and Forward reopens it. Only a dismissal while the
 * module is still the current URL is one: a close that the route itself caused
 * has nowhere to go back to.
 *
 * Presentation, focus containment, scroll lock and accessible naming all stay
 * with Dialog. Nothing here reads product data or decides what may be shown.
 */
export function ModuleDetailDialog({ eyebrow, title, lede, children }: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const open = isModuleDetailPath(usePathname());

  return <Dialog
    open={open}
    onClose={() => { if (open) router.back(); }}
    size="lg"
    eyebrow={eyebrow}
    title={title}
    lede={lede}
    closeLabel="Cerrar el detalle del módulo"
  >{children}</Dialog>;
}
