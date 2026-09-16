import { Page } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return <Page width="content">
    <EmptyState
      title="Página no encontrada"
      description="La dirección que abriste no existe o ha cambiado."
      action={<ButtonLink href="/app">Volver al inicio</ButtonLink>}
    />
  </Page>;
}
