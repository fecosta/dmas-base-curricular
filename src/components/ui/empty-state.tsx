import { cn } from "./cn";

/** Deliberate empty state: a titled, bordered panel rather than a stray sentence. */
export function EmptyState({ title, description, action, className, align = "center" }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  align?: "center" | "start";
}) {
  return <div className={cn(
    "rounded-lg border border-dashed border-hairline-strong bg-surface/70 px-6 py-10",
    align === "center" ? "text-center" : "text-start",
    className,
  )}>
    <p className="text-lg font-bold text-ink">{title}</p>
    {description && <p className={cn("mt-2 text-ink-muted", align === "center" && "mx-auto max-w-xl")}>{description}</p>}
    {action && <div className={cn("mt-6 flex flex-wrap gap-3", align === "center" && "justify-center")}>{action}</div>}
  </div>;
}

/** Inline "nothing here yet" note for small side panels, where a full panel would overwhelm. */
export function EmptyNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-ink-muted", className)}>{children}</p>;
}
