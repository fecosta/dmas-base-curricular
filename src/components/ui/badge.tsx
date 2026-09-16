import { cn } from "./cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "info";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-inset text-ink-soft",
  primary: "bg-primary text-white",
  success: "bg-success/18 text-success-ink",
  warning: "bg-warning/18 text-warning-ink",
  info: "bg-primary/12 text-primary",
};

export function Badge({ tone = "neutral", className, children }: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-bold", tones[tone], className)}>{children}</span>;
}
