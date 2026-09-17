import Link from "next/link";
import { cn } from "./cn";
import { toneDot, type Tone } from "./card";

/**
 * Compact toggle chip for a single filter value.
 *
 * Links, not buttons — the same reason SegmentedLinks uses them: each value is a
 * real URL, which is what keeps the Library's GET-based filter contract and deep
 * links intact. `href` points at the state the chip produces, so a selected
 * chip's href clears that value again.
 *
 * Selection reads as a solid primary fill rather than the per-group colour the
 * reference uses. At chip sizes the group tones (green, amber, lilac) cannot
 * carry white text at 4.5:1; the group's colour identity is carried by the
 * FilterGroup marker instead, where it is decorative.
 *
 * Migrating the Library filter form onto these is Phase 3.
 */
export function FilterChip({ label, href, selected, count, className }: {
  label: string;
  href: string;
  selected: boolean;
  count?: number;
  className?: string;
}) {
  return <Link
    href={href}
    prefetch={false}
    aria-current={selected ? "true" : undefined}
    className={cn(
      "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-control font-medium no-underline transition-colors hover:no-underline",
      selected
        ? "border-primary bg-primary text-white shadow-raised hover:text-white"
        : "border-hairline bg-inset text-ink-soft hover:border-hairline-strong hover:text-ink",
      className,
    )}
  >
    <span className="min-w-0 truncate">{label}</span>
    {count !== undefined && <span className={cn("text-meta font-semibold tracking-normal", selected ? "text-white/75" : "text-label")}>{count}</span>}
  </Link>;
}

/**
 * Collapsible heading + count presentation for a group of FilterChips.
 *
 * <details> rather than component state: the Library filter panel already uses
 * it, it collapses without JavaScript, and it keeps this primitive renderable
 * from a Server Component.
 */
export function FilterGroup({ label, tone = "primary", selectedCount = 0, defaultOpen = true, className, children }: {
  label: string;
  tone?: Tone;
  selectedCount?: number;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return <details open={defaultOpen} className={cn("group border-t border-hairline", className)}>
    <summary className="flex cursor-pointer list-none items-center gap-2.5 px-4 py-3 text-control font-bold text-ink">
      <span aria-hidden="true" className={cn("size-[7px] shrink-0 rounded-full", toneDot[tone])} />
      <span className="flex-1 text-start">{label}</span>
      {selectedCount > 0 && <span className="rounded-full bg-ink-soft px-1.5 py-0.5 text-meta font-bold tracking-normal text-white">{selectedCount}</span>}
      <span aria-hidden="true" className="shrink-0 text-label transition-transform group-open:rotate-45">＋</span>
    </summary>
    <div className="flex flex-wrap gap-1.5 px-4 pb-4">{children}</div>
  </details>;
}
