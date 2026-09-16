"use client";

import { Page } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ContributionsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Page width="content">
    <EmptyState
      title="No pudimos abrir la administración de contenido."
      description="Inténtalo nuevamente. Si el problema continúa, vuelve más tarde."
      action={<Button onClick={reset}>Reintentar</Button>}
    />
    {error.digest && <p className="mt-4 text-center text-xs text-ink-muted">Referencia del error: {error.digest}</p>}
  </Page>;
}
