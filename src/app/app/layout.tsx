import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { signOut } from "@/app/login/actions";
import { PrimaryNav, type NavItem } from "@/components/primary-nav";
import { Container } from "@/components/ui/page";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const access = await requireAccess();
  const roleLabel = access.role === "Admin" ? "Administrador" : "Colaborador";

  // Filtered here, not in the client component: an Admin-only destination must
  // never be serialised into a reader's markup.
  const navigation: NavItem[] = [{ label: "Biblioteca", href: "/app/library" }];
  if (access.role === "Admin") navigation.push({ label: "Administrar contenido", href: "/app/contributions" });

  return <div className="flex min-h-screen flex-col bg-canvas">
    <div className="bg-night text-white">
      <Container width="wide" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 text-[11px]">
        <span className="inline-flex items-center gap-2 text-white/70">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
          Red de formación política
        </span>
        {/*
          The role stays a bare text node inside this span. Wrapping it in its own
          element would make it an exact-text match here as well as in the "Tu cuenta"
          panel on /app, where the E2E suite asserts a single visible role.
        */}
        <span className="text-white/70">
          Sesión: <span className="font-bold text-white">{access.organizationName}</span> · {roleLabel}
        </span>
      </Container>
    </div>

    <header className="border-b border-hairline bg-surface">
      <Container width="wide" className="flex items-center gap-4 py-3 md:gap-8">
        <Link href="/app" prefetch={false} className="flex shrink-0 items-center gap-3 no-underline hover:no-underline">
          <span aria-hidden="true" className="grid size-9 place-items-center rounded-md bg-primary text-sm font-black text-white">D+</span>
          <span className="leading-tight">
            <span className="block text-base font-black tracking-[-0.02em] text-ink">Base Curricular</span>
            <span className="block text-[10px] font-extrabold uppercase tracking-[0.18em] text-label">Democracia+</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2 md:gap-6">
          <nav aria-label="Navegación principal">
            <PrimaryNav items={navigation} />
          </nav>
          {/* Exactly one sign-out control exists in the shell; a second copy for
              mobile would duplicate its accessible name. */}
          <form action={signOut} className="shrink-0">
            <Button type="submit" variant="secondary" size="sm">Cerrar sesión</Button>
          </form>
        </div>
      </Container>
    </header>

    <div className="flex-1">{children}</div>

    <footer className="on-dark mt-16 bg-night text-white">
      <Container width="wide" className="py-12">
        <span className="text-xl font-black tracking-[-0.03em] text-accent">DEMOCRACIA+</span>
        <p className="mt-4 max-w-md text-sm text-white/70">
          Base curricular del programa de formación política de la red. Módulos, programas, docentes e
          instituciones de referencia en un solo lugar.
        </p>
      </Container>
      <div className="border-t border-white/10">
        <Container width="wide" className="py-5 text-xs text-white/55">
          Democracia+ · Red de formación política
        </Container>
      </div>
    </footer>
  </div>;
}
