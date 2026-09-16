import { cn } from "./cn";

/** Accent tones drive the coloured top rule the reference uses to distinguish curriculum axes. */
export type Tone = "neutral" | "primary" | "success" | "accent" | "warning";

export const toneBorder: Record<Tone, string> = {
  neutral: "border-t-hairline-strong",
  primary: "border-t-primary",
  success: "border-t-success",
  accent: "border-t-accent",
  warning: "border-t-warning",
};

export const toneDot: Record<Tone, string> = {
  neutral: "bg-label",
  primary: "bg-primary",
  success: "bg-success",
  accent: "bg-accent",
  warning: "bg-warning",
};

export function Card({ accent, className, children, as: As = "div", ...props }: {
  accent?: Tone;
  className?: string;
  as?: "div" | "article" | "section" | "li";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return <As
    {...props}
    className={cn(
      "rounded-lg border border-hairline bg-surface shadow-card",
      accent && `border-t-[3px] ${toneBorder[accent]}`,
      className,
    )}
  >{children}</As>;
}

/** Inverted surface used for the reference's dark side panels. */
export function DarkCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("on-dark rounded-lg bg-night-deep p-6 text-white", className)}>{children}</div>;
}
