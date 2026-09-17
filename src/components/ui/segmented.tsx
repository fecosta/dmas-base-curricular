import Link from "next/link";
import { cn } from "./cn";

export type SegmentedOption = { label: string; href: string; active: boolean };

/**
 * Link-based pill group (the reference's EJE / VISTA controls).
 * Links, not buttons: each option is a real URL, which keeps the library's
 * GET-based filter contract and deep links intact.
 */
export function SegmentedLinks({ label, options, className }: {
  label: string;
  options: SegmentedOption[];
  className?: string;
}) {
  return <div className={cn("flex flex-wrap items-center gap-3", className)}>
    <span className="filter-label shrink-0">{label}</span>
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1 rounded-full border border-hairline bg-inset p-1">
      {options.map((option) => <Link
        key={option.href + option.label}
        href={option.href}
        prefetch={false}
        aria-current={option.active ? "page" : undefined}
        className={cn(
          "rounded-full px-4 py-2 text-control font-bold no-underline transition-colors hover:no-underline",
          option.active
            ? "bg-primary text-white shadow-raised hover:text-white"
            : "text-ink-soft hover:bg-surface hover:text-ink",
        )}
      >{option.label}</Link>)}
    </div>
  </div>;
}
