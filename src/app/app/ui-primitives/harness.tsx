"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { SearchInput } from "@/components/ui/search-input";
import { FilterChip, FilterGroup } from "@/components/ui/filter";

/**
 * Exercises the SPEC-006 Phase 1 overlay and search primitives so their
 * browser-only behaviour — focus containment, Escape, focus restoration,
 * background scroll lock, the "/" shortcut — can be asserted in a real browser
 * before later phases wire them into product surfaces.
 *
 * Fixture content only. No product data, no server action, no authority.
 */
export function PrimitivesHarness() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return <div className="grid gap-6">
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs" onClick={() => setDialogOpen(true)}>Abrir diálogo</Button>
      <Button size="xs" variant="secondary" onClick={() => setDrawerOpen(true)}>Abrir panel lateral</Button>
    </div>

    <SearchInput label="Buscar en la biblioteca" name="q" placeholder="Buscar tema, docente o institución…" className="max-w-md" />

    <FilterGroup label="País o alcance" tone="primary" selectedCount={1}>
      <FilterChip label="España" href="#espana" selected count={4} />
      <FilterChip label="México" href="#mexico" selected={false} count={2} />
    </FilterGroup>

    {/* Tall filler so the scroll lock has something to lock. */}
    <div className="h-[200vh] rounded-lg border border-dashed border-hairline-strong" />

    <Dialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      eyebrow="Fixture"
      title="Diálogo de prueba"
      lede="Contenido ficticio para validar el primitivo."
      footer={<Button size="xs" variant="secondary" onClick={() => setDialogOpen(false)}>Listo</Button>}
    >
      <p className="text-body text-ink-soft">Primer párrafo del cuerpo desplazable.</p>
      <Button size="xs" variant="secondary" className="mt-4">Acción interna</Button>
      <div className="mt-4 h-[150vh] rounded-md bg-surface" />
      <p className="text-body text-ink-soft">Último párrafo del cuerpo desplazable.</p>
    </Dialog>

    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Filtros">
      <FilterChip label="España" href="#espana" selected={false} count={4} />
      <div className="mt-4 h-[150vh] rounded-md bg-surface" />
      <p className="text-body text-ink-soft">Fin del panel.</p>
    </Drawer>
  </div>;
}
