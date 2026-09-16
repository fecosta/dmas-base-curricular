import { cn } from "./cn";
import { Container, type PageWidth } from "./page";

/** Light page header: eyebrow, title, lede and an optional action cluster. */
export function PageHeader({ eyebrow, title, lede, actions, className, titleId }: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  className?: string;
  titleId?: string;
}) {
  return <header className={cn("flex flex-wrap items-end justify-between gap-6 border-b border-hairline pb-8", className)}>
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 id={titleId} className="mt-3 max-w-3xl text-4xl leading-[1.05] sm:text-5xl">{title}</h1>
      {lede && <p className="mt-4 max-w-2xl text-lg text-ink-soft">{lede}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </header>;
}

/** The Democracia+ wordmark used on dark bands. */
export function Wordmark({ className }: { className?: string }) {
  return <span className={cn("text-xl font-black tracking-[-0.03em] text-accent", className)}>DEMOCRACIA+</span>;
}

/** Green-dot small-caps eyebrow from the reference's hero. */
export function DotEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-success", className)}>
    <span aria-hidden="true" className="size-2 rounded-full bg-success" />
    {children}
  </span>;
}

/**
 * Full-bleed dark band that opens the reader surfaces.
 * "tall" is the landing treatment, "compact" the explorer treatment.
 */
export function HeroBand({ eyebrow, title, lede, actions, size = "compact", width = "wide" }: {
  eyebrow?: string;
  title: string;
  lede?: string;
  actions?: React.ReactNode;
  size?: "tall" | "compact";
  width?: Exclude<PageWidth, "bleed">;
}) {
  return <div className="on-dark relative isolate overflow-hidden bg-night text-white">
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_120%_at_12%_0%,#151a6b_0%,transparent_60%),radial-gradient(60%_120%_at_85%_20%,#2a1350_0%,transparent_55%)]" />
    <Container width={width} className={size === "tall" ? "py-16 lg:py-24" : "py-10 lg:py-14"}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <Wordmark />
        {eyebrow && <>
          <span aria-hidden="true" className="hidden h-5 w-px bg-white/25 sm:block" />
          <DotEyebrow>{eyebrow}</DotEyebrow>
        </>}
      </div>
      {/*
        Intentionally not text-transform:uppercase. Chromium folds text-transform
        into the accessible name, which would turn "Biblioteca" into "BIBLIOTECA"
        and break the exact-name heading assertions (and make screen readers
        spell headings out).
      */}
      <h1 className={cn(
        "mt-5 max-w-4xl font-black leading-[0.95] tracking-[-0.03em]",
        size === "tall" ? "text-5xl sm:text-7xl" : "text-4xl sm:text-6xl",
      )}>{title}</h1>
      {lede && <p className="mt-6 max-w-2xl text-lg text-white/75">{lede}</p>}
      {actions && <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div>}
    </Container>
  </div>;
}
