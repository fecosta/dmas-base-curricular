import Link from "next/link";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "on-dark";
/** "xs" is the reference's dense control size, used in toolbars and card footers. */
export type ButtonSize = "xs" | "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-bold no-underline transition-colors hover:no-underline focus-visible:no-underline disabled:opacity-60";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-raised hover:bg-primary-strong hover:text-white",
  secondary: "border border-hairline-strong bg-surface text-ink hover:bg-inset hover:text-ink",
  ghost: "text-primary hover:bg-primary/8 hover:text-primary-strong",
  danger: "text-danger hover:bg-danger/8 hover:text-danger",
  "on-dark": "bg-accent text-night hover:bg-white hover:text-night",
};

const sizes: Record<ButtonSize, string> = {
  xs: "px-3.5 py-2.5 text-control",
  sm: "px-3 py-2 text-sm",
  md: "px-5 py-3",
};

function classes(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({ variant = "primary", size = "md", className, ...props }: {
  variant?: ButtonVariant;
  size?: ButtonSize;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={classes(variant, size, className)} />;
}

export type IconButtonTone = "light" | "on-dark";

const iconTones: Record<IconButtonTone, string> = {
  light: "border-hairline bg-inset text-ink-muted hover:border-hairline-strong hover:text-ink",
  "on-dark": "border-white/25 bg-white/12 text-white hover:border-warning hover:bg-warning hover:text-night",
};

/**
 * Round icon-only control — the reference's dismiss affordance on overlay and
 * panel headers. `label` is required because the visible glyph is decorative:
 * without it the control would reach assistive technology unnamed. At 34px
 * (28px compact) it stays above the 24px minimum target size.
 */
export function IconButton({ label, tone = "light", compact = false, className, children, ...props }: {
  label: string;
  tone?: IconButtonTone;
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label">) {
  return <button
    type="button"
    {...props}
    aria-label={label}
    className={cn(
      "inline-grid shrink-0 place-items-center rounded-full border leading-none transition-colors",
      compact ? "size-7 text-control" : "size-8.5 text-sm",
      iconTones[tone],
      className,
    )}
  >
    <span aria-hidden="true">{children}</span>
  </button>;
}

/** A Next <Link> wearing the button look. Keeps prefetch={false}, the repository-wide default. */
export function ButtonLink({ variant = "primary", size = "md", className, href, children, ...props }: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href: string;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return <Link href={href} prefetch={false} {...props} className={classes(variant, size, className)}>{children}</Link>;
}
