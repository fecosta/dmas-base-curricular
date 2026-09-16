import Link from "next/link";
import { listManagedContent } from "@/lib/contributions/queries";
import { contributionTypeLabel } from "@/lib/contributions/types";
import { StatusBadge } from "./status-badge";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ContributionsPage() {
  const contents = await listManagedContent();

  return <Page width="content">
    <PageHeader
      eyebrow="Gestión editorial"
      title="Administrar contenido"
      lede="Crea, edita y publica el conocimiento curricular de la red."
      actions={<ButtonLink href="/app/contributions/new">Crear contenido</ButtonLink>}
    />

    {contents.length === 0
      ? <EmptyState
          className="mt-10"
          title="Todavía no hay contenido administrable"
          description="Crea un borrador para comenzar: usa Crear contenido en la parte superior de esta página."
        />
      : <div className="mt-10 grid gap-4">
          {contents.map((item) => <Card key={`${item.type}-${item.contentId}`} as="article" className="flex flex-wrap items-center justify-between gap-5 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <p className="eyebrow">{contributionTypeLabel(item.type)}</p>
                <StatusBadge state={item.state} />
              </div>
              <h2 className="mt-2 text-lg">{item.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">
                {item.currentPublishedRevisionNumber && `Versión ${item.currentPublishedRevisionNumber} publicada`}
                {item.currentPublishedRevisionNumber && item.draftRevisionNumber ? " · " : ""}
                {item.draftRevisionNumber && `Versión ${item.draftRevisionNumber} en borrador`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {item.currentPublishedRevisionId && <Link href={`/app/contributions/${item.type}/${item.currentPublishedRevisionId}`} prefetch={false} className="text-sm font-bold">Ver versión publicada</Link>}
              {item.draftRevisionId && <ButtonLink href={`/app/contributions/${item.type}/${item.draftRevisionId}`} size="sm" variant="secondary">Editar borrador</ButtonLink>}
            </div>
          </Card>)}
        </div>}
  </Page>;
}
