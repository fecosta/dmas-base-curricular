import { cn } from "./cn";

export type NoticeTone = "info" | "success" | "warning" | "error";

const tones: Record<NoticeTone, string> = {
  info: "border-primary/25 bg-primary/8 text-primary-strong",
  success: "border-success/35 bg-success/12 text-success-ink",
  warning: "border-warning/35 bg-warning/12 text-warning-ink",
  error: "border-danger/30 bg-danger/8 text-danger",
};

/**
 * One treatment for every inline banner. Roles are part of the behavioural
 * contract the E2E suite asserts, so errors announce as alerts and successes as
 * statuses unless the caller overrides.
 */
export function Notice({ tone = "info", role, as: As = "p", className, children }: {
  tone?: NoticeTone;
  role?: React.AriaRole;
  /** "div" is for notices that carry block content, such as a list of blockers. */
  as?: "p" | "div";
  className?: string;
  children: React.ReactNode;
}) {
  const resolvedRole = role ?? (tone === "error" ? "alert" : tone === "success" ? "status" : undefined);
  return <As role={resolvedRole} className={cn("rounded-md border px-4 py-3 font-semibold", tones[tone], className)}>{children}</As>;
}
