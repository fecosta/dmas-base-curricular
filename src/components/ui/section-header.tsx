import { cn } from "./cn";
import { toneDot, type Tone } from "./card";

/** Section title with an optional right-hand meta slot (result counts, summaries). */
export function SectionHeader({ title, id, meta, className, level: Level = "h2" }: {
  title: string;
  id?: string;
  meta?: React.ReactNode;
  className?: string;
  level?: "h2" | "h3";
}) {
  return <div className={cn("mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1", className)}>
    <Level id={id} className="text-2xl">{title}</Level>
    {meta && <span className="text-sm text-ink-muted">{meta}</span>}
  </div>;
}

/**
 * Compact section heading with a coloured marker, as used inside the reference's detail view.
 * Deliberately not uppercased: Chromium folds text-transform into the accessible
 * name, which would break exact-name heading assertions such as "Programa".
 */
export function SectionLabel({ children, tone = "primary", id, className, level: Level = "h2" }: {
  children: React.ReactNode;
  tone?: Tone;
  id?: string;
  className?: string;
  level?: "h2" | "h3";
}) {
  return <Level id={id} className={cn("flex items-center gap-2 text-sm font-extrabold tracking-[0.04em] text-ink-soft", className)}>
    <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-[4px]", toneDot[tone])} />
    {children}
  </Level>;
}

/** Pluralises the Spanish result count used across the library surfaces. */
export function resultCount(total: number) {
  return `${total} resultado${total === 1 ? "" : "s"}`;
}
