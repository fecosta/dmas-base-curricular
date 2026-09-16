import { cn } from "./cn";

/**
 * Wraps a control in an implicit <label>, which is how every form in this
 * repository associates labels today. Playwright selects these by their exact
 * visible text (including a trailing " *" on required fields), so `label` must
 * render verbatim and the control must stay inside the <label>.
 */
export function Field({ label, hint, className, children }: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return <label className={cn("block", className)}>
    <span className="filter-label">{label}</span>
    {children}
    {hint && <span className="mt-2 block text-xs text-ink-muted">{hint}</span>}
  </label>;
}

/** Label/value pair for read-only metadata, mirroring the reference's chip rows. */
export function MetaItem({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-md border border-hairline bg-inset px-4 py-3">
    <dt className="filter-label">{label}</dt>
    <dd className="mt-1 font-bold text-ink">{children}</dd>
  </div>;
}
