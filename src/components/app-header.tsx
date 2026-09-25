"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { PrimaryNav, type NavItem } from "@/components/primary-nav";
import { ShellSearch } from "@/components/shell-search";
import { Container } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";

const MENU_ID = "menu-de-navegacion";

/** Mirrors --breakpoint-compact. Above it the sheet cannot be reached, so it closes itself. */
const COMPACT = "(min-width: 73.75rem)";

/**
 * The authenticated application header, in the reference's composition: one
 * sticky translucent band carrying identity, destinations, Library search and
 * session controls, rather than a stacked utility strip above a toolbar.
 *
 * `items` arrives already filtered by live role from the server layout. Nothing
 * here inspects or infers authority — a responsive variant must never be what
 * decides whether an Admin destination exists.
 *
 * Above the compact breakpoint the destinations sit inline and the session
 * controls sit beside them. Below it both move into a modal navigation sheet,
 * which is the reference's own compact behaviour. The two are never presented at
 * once: the inline row is display:none below the breakpoint, and the sheet's
 * contents are not rendered at all until it opens, so neither destinations nor
 * sign-out are ever duplicated in the accessibility tree.
 */
export function AppHeader({ items, organizationName, roleLabel }: {
  items: NavItem[];
  organizationName: string;
  roleLabel: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Growing past the compact breakpoint hides the trigger, so leaving the sheet
  // open there would strand it next to the inline navigation it stands in for.
  useEffect(() => {
    const wide = window.matchMedia(COMPACT);
    const sync = () => { if (wide.matches) setMenuOpen(false); };
    wide.addEventListener("change", sync);
    return () => wide.removeEventListener("change", sync);
  }, []);

  return <>
    <header className="sticky top-0 z-40 border-b border-hairline bg-surface/90 backdrop-blur-xl backdrop-saturate-150">
      <Container width="wide" className="flex h-16 items-center gap-3 compact:gap-5">
        <Link href="/app" prefetch={false} className="flex shrink-0 items-center gap-2.5 no-underline hover:no-underline">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-[10px] bg-primary text-control font-black text-white">D+</span>
          {/* On phones the wordmark yields its width to the search; it stays the link's accessible name. */}
          <span className="sr-only leading-tight sm:not-sr-only">
            <span className="block text-[0.9375rem] font-extrabold tracking-[-0.02em] text-ink">Base Curricular</span>
            <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-label">Democracia+</span>
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden compact:block">
          <PrimaryNav items={items} />
        </nav>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 compact:gap-3">
          <ShellSearch className="max-w-[250px] compact:max-w-[340px]" />

          {/*
            Organisation and role stay one text run. Giving the role its own
            element would make it an exact-text match here as well as in the
            "Tu cuenta" panel on /app, where the E2E suite asserts a single
            visible role. It is a label, never a source of authority.
          */}
          <span className="hidden shrink-0 items-center gap-2 rounded-full border border-hairline bg-inset px-3 py-1.5 text-control text-ink-muted compact:inline-flex">
            <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success" />
            <span className="font-bold text-ink">{organizationName}</span> · {roleLabel}
          </span>

          <form action={signOut} className="hidden shrink-0 compact:block">
            <Button type="submit" variant="secondary" size="xs">Cerrar sesión</Button>
          </form>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-controls={MENU_ID}
            className="grid size-9 shrink-0 place-items-center gap-1 rounded-xl border border-hairline bg-surface compact:hidden"
          >
            <span className="sr-only">Menú</span>
            <span aria-hidden="true" className="flex flex-col gap-1">
              <span className="block h-0.5 w-[15px] rounded-full bg-ink" />
              <span className="block h-0.5 w-[15px] rounded-full bg-ink" />
              <span className="block h-0.5 w-[15px] rounded-full bg-ink" />
            </span>
          </button>
        </div>
      </Container>
    </header>

    {/*
      The reference's compact navigation sheet. Escape, focus containment, focus
      restoration and background scroll lock come from the Phase 1 Drawer, which
      is a native modal <dialog>.
    */}
    <Drawer id={MENU_ID} open={menuOpen} onClose={() => setMenuOpen(false)} side="end" tone="dark" title="Menú">
      <div className="flex min-h-full flex-col gap-6">
        <div>
          <p className="text-meta font-bold uppercase text-accent">Sesión</p>
          <p className="mt-2 text-body text-white/70">
            <span className="font-bold text-white">{organizationName}</span> · {roleLabel}
          </p>
        </div>

        <nav aria-label="Navegación principal">
          <PrimaryNav items={items} orientation="column" onNavigate={() => setMenuOpen(false)} />
        </nav>

        {/*
          The only sign-out control at this width; the header's copy is
          display:none below the compact breakpoint.
        */}
        <form action={signOut} className="mt-auto">
          <Button type="submit" variant="on-dark" size="sm" className="w-full">Cerrar sesión</Button>
        </form>
      </div>
    </Drawer>
  </>;
}
