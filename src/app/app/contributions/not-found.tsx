import { Page } from "@/components/ui/page";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

export default function ContributionNotFound() {
  return <Page width="content">
    <EmptyState
      title="No encontramos este contenido."
      description="Puede que no exista o que no tengas permiso para verlo."
      action={<ButtonLink href="/app/contributions">Volver a administrar contenido</ButtonLink>}
    />
  </Page>;
}
