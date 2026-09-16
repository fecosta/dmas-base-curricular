import { Page } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return <Page width="content">
    <EmptyState
      title="No encontramos esta publicación."
      description="Puede que no exista, no esté publicada o haya sido archivada."
      action={<ButtonLink href="/app/library">Volver a la biblioteca</ButtonLink>}
    />
  </Page>;
}
