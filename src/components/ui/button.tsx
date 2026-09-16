import Link from "next/link";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "on-dark";
export type ButtonSize = "sm" | "md";

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

/** A Next <Link> wearing the button look. Keeps prefetch={false}, the repository-wide default. */
export function ButtonLink({ variant = "primary", size = "md", className, href, children, ...props }: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href: string;
  className?: string;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className">) {
  return <Link href={href} prefetch={false} {...props} className={classes(variant, size, className)}>{children}</Link>;
}
