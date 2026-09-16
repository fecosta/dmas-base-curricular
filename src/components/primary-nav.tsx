"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveNavPath } from "@/lib/ui/nav";
import { cn } from "@/components/ui/cn";

export type NavItem = { label: string; href: string };

/**
 * Primary navigation with active state and a mobile disclosure.
 *
 * The link list is rendered exactly once and reflows with CSS between the
 * horizontal desktop bar and the mobile panel. Rendering separate mobile and
 * desktop copies would duplicate accessible names and break the E2E selectors
 * that click these links.
 *
 * `items` is filtered on the server, so an Admin-only destination never reaches
 * a reader's markup.
 */
export function PrimaryNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return <div className="relative flex items-center">
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      aria-controls="navegacion-principal"
      className="rounded-md border border-hairline-strong px-3 py-2 text-ink md:hidden"
    >
      <span className="sr-only">Menú</span>
      <span aria-hidden="true" className="block space-y-1">
        <span className="block h-0.5 w-5 bg-ink" />
        <span className="block h-0.5 w-5 bg-ink" />
        <span className="block h-0.5 w-5 bg-ink" />
      </span>
    </button>

    <ul
      id="navegacion-principal"
      className={cn(
        // Anchored to the right so the panel cannot overflow the viewport on
        // narrow screens, then reset to an inline row from md upwards.
        "absolute right-0 top-full z-20 mt-2 w-max min-w-56 max-w-[calc(100vw-2.5rem)] gap-1 rounded-lg border border-hairline bg-surface p-2 shadow-overlay",
        "md:static md:z-auto md:mt-0 md:flex md:w-auto md:min-w-0 md:max-w-none md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none",
        open ? "block" : "hidden",
      )}
    >
      {items.map((item) => {
        const active = isActiveNavPath(pathname, item.href);
        return <li key={item.href}>
          <Link
            href={item.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={cn(
              "block rounded-full px-4 py-2 text-sm font-bold no-underline transition-colors hover:no-underline",
              active ? "bg-primary/12 text-primary" : "text-ink-soft hover:bg-inset hover:text-ink",
            )}
          >{item.label}</Link>
        </li>;
      })}
    </ul>
  </div>;
}
