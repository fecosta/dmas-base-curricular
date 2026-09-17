"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActiveNavPath } from "@/lib/ui/nav";
import { cn } from "@/components/ui/cn";

export type NavItem = { label: string; href: string };

/**
 * Primary destinations, as the reference's pill row.
 *
 * `items` is filtered on the server by live role, so an Admin-only destination
 * never reaches a reader's markup. This component must not decide who sees what:
 * it renders exactly the destinations it is handed.
 *
 * Presentation only — AppHeader decides where this row appears and when the
 * compact menu takes over.
 */
export function PrimaryNav({ items, orientation = "row", onNavigate, className }: {
  items: NavItem[];
  /** "column" is the compact menu sheet's stacked treatment. */
  orientation?: "row" | "column";
  /** Lets the compact menu sheet dismiss itself once a destination is chosen. */
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const column = orientation === "column";

  return <ul className={cn(column ? "flex flex-col gap-1" : "flex items-center gap-1", className)}>
    {items.map((item) => {
      const active = isActiveNavPath(pathname, item.href);
      return <li key={item.href}>
        <Link
          href={item.href}
          prefetch={false}
          aria-current={active ? "page" : undefined}
          onClick={onNavigate}
          className={cn(
            "block rounded-full font-semibold no-underline transition-colors hover:no-underline",
            column
              ? "px-3 py-3 text-body"
              : "px-4 py-2 text-control",
            active
              ? column ? "bg-white/12 text-white" : "bg-primary/10 text-primary"
              : column
                ? "text-white/70 hover:bg-white/8 hover:text-white"
                : "text-ink-muted hover:bg-inset hover:text-ink",
          )}
        >{item.label}</Link>
      </li>;
    })}
  </ul>;
}
