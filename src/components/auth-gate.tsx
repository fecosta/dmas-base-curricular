import { cn } from "@/components/ui/cn";

/**
 * The dark entry screen shared by /login and /access-denied.
 * Callers own the contents of the card, so the first interactive control on
 * /login remains the Google button.
 */
export function AuthGate({ title, lede, children }: {
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return <main id="contenido" className="on-dark relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-night px-5 py-16 text-white">
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_20%_10%,#1a1f7a_0%,transparent_60%),radial-gradient(55%_75%_at_80%_85%,#2f1557_0%,transparent_60%)]" />

    <div className="w-full max-w-lg text-center">
      <span className="text-2xl font-black tracking-[-0.03em] text-accent">DEMOCRACIA+</span>
      <p className="mt-3 flex items-center justify-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-success">
        <span aria-hidden="true" className="size-2 rounded-full bg-success" />
        Red de formación política
      </p>
      <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-[-0.03em] sm:text-6xl">{title}</h1>
      {lede && <p className="mx-auto mt-6 max-w-md text-white/70">{lede}</p>}
    </div>

    <div className={cn("mt-10 w-full max-w-lg rounded-xl bg-surface p-6 text-ink shadow-overlay sm:p-8")}>
      {children}
    </div>
  </main>;
}
