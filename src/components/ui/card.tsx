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

/**
 * "panel" is the reference's lifted treatment for standalone panels such as the
 * filter sidebar; "card" stays the default for cards sitting in a grid.
 */
export type CardElevation = "card" | "panel" | "none";

const elevations: Record<CardElevation, string> = {
  card: "shadow-card",
  panel: "shadow-panel",
  none: "",
};

export function Card({ accent, elevation = "card", className, children, as: As = "div", ...props }: {
  accent?: Tone;
  elevation?: CardElevation;
  className?: string;
  as?: "div" | "article" | "section" | "li";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return <As
    {...props}
    className={cn(
      "rounded-lg border border-hairline bg-surface",
      elevations[elevation],
      accent && `border-t-[3px] ${toneBorder[accent]}`,
      className,
    )}
  >{children}</As>;
}

/** Inverted surface used for the reference's dark side panels. */
export function DarkCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("on-dark rounded-lg bg-night-deep p-6 text-white", className)}>{children}</div>;
}
