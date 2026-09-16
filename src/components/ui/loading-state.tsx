import { cn } from "./cn";

/** Shared loading treatment. role="status" + aria-live are asserted behaviour. */
export function LoadingState({ title, className }: { title: string; className?: string }) {
  return <div role="status" aria-live="polite" className={cn("flex items-center gap-4", className)}>
    <span aria-hidden="true" className="size-6 shrink-0 animate-spin rounded-full border-2 border-hairline-strong border-t-primary" />
    <p className="text-lg font-bold text-ink-soft">{title}</p>
  </div>;
}

/** Placeholder block used while a results region resolves. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-pulse rounded-md bg-hairline", className)} />;
}
