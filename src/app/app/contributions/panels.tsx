import { cn } from "@/components/ui/cn";

/**
 * Shared composition for the Admin content-management surfaces.
 *
 * These are presentation boundaries only: they group existing fields, existing
 * server actions and existing governance controls into the Explorer's editorial
 * rhythm. They hold no product state, name no field, and grant no authority.
 */

/**
 * One editorial group of fields inside a contribution form.
 *
 * Deliberately a plain <section> with a heading rather than a named region: a
 * form of four groups would otherwise put four landmarks in the page, which is
 * noise rather than navigation. The heading hierarchy carries the structure.
 *
 * `step` is the reference's numbered marker. It is decorative ordering, not a
 * wizard: every group is on screen at once and one submit saves all of them.
 */
export function FormSection({ step, title, description, columns = 2, className, children }: {
  step: string;
  title: string;
  description?: string;
  /** Relationship pickers and long prose read better in one full-width column. */
  columns?: 1 | 2;
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={cn("rounded-xl border border-hairline bg-surface p-5 shadow-card explorer:p-6", className)}>
    <div className="border-b border-hairline pb-4">
      <h2 className="flex items-center gap-3 text-base">
        <StepMarker>{step}</StepMarker>
        <span className="min-w-0">{title}</span>
      </h2>
      {description && <p className="mt-2 text-body text-ink-muted">{description}</p>}
    </div>
    <div className={cn("mt-5 grid gap-5", columns === 2 && "explorer:grid-cols-2")}>{children}</div>
  </section>;
}

/** Full-width field inside a two-column FormSection grid. */
export const WIDE_FIELD = "explorer:col-span-2";

/** The reference's square numeric marker, used to order the groups of a form. */
export function StepMarker({ children }: { children: React.ReactNode }) {
  return <span
    aria-hidden="true"
    className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-meta font-extrabold tracking-normal text-primary"
  >{children}</span>;
}

/**
 * A panel in the management rail: status, lifecycle and governance, kept beside
 * the editing surface rather than mixed into it.
 *
 * `id` is opt-in because only the governance panel is a landmark. Naming a
 * <section> is what makes it a region, and Gobernanza is the one panel whose
 * outcomes (including a dependency blocker) need to be addressable as a whole.
 */
export function SidePanel({ id, title, description, children, className }: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return <section
    aria-labelledby={id}
    className={cn("rounded-xl border border-hairline bg-surface p-5 shadow-card", className)}
  >
    <h2 id={id} className="text-base">{title}</h2>
    {description && <p className="mt-2 text-body text-ink-muted">{description}</p>}
    <div className="mt-4">{children}</div>
  </section>;
}

/** Label/value row for the rail's status summary. */
export function PanelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-hairline py-2.5 first:border-t-0 first:pt-0">
    <dt className="filter-label">{label}</dt>
    <dd className="min-w-0 text-control font-bold text-ink">{children}</dd>
  </div>;
}
