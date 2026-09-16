import { cn } from "./cn";

export type PageWidth = "wide" | "content" | "narrow" | "bleed";

// The reference explorer runs to 1520px; reading surfaces stay narrower.
const maxWidths: Record<Exclude<PageWidth, "bleed">, string> = {
  wide: "max-w-[1520px]",
  content: "max-w-6xl",
  narrow: "max-w-3xl",
};

const gutter = "mx-auto w-full px-5 lg:px-8";

/** Horizontal container. Vertical rhythm is left to the caller so bands can set their own. */
export function Container({ width = "wide", className, children }: {
  width?: Exclude<PageWidth, "bleed">;
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(gutter, maxWidths[width], className)}>{children}</div>;
}

/**
 * The single `<main id="contenido">` every route renders. The id is load-bearing:
 * the root layout's skip link targets it.
 * width="bleed" is for pages that own full-width bands (hero/footer) and
 * constrain their own sections with <Container>.
 */
export function Page({ width = "content", pad = true, className, children }: {
  width?: PageWidth;
  pad?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const layout = width === "bleed" ? "" : cn(gutter, maxWidths[width], pad && "py-10 lg:py-14");
  return <main id="contenido" className={cn(layout, className)}>{children}</main>;
}
