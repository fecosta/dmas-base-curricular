import Link from "next/link";
import { notFound } from "next/navigation";
import { AttachmentManager } from "../../attachment-manager";
import { ContributionForm } from "../../contribution-form";
import { PublishAction, SuccessorAction } from "../../management-actions";
import { ArchiveAction } from "../../governance-actions";
import { PanelRow, SidePanel } from "../../panels";
import { getContribution, getContributionOptions } from "@/lib/contributions/queries";
import { contributionTypeLabel, isContributionType, type ManagementViewState } from "@/lib/contributions/types";
import { formatGovernanceTimestamp } from "@/lib/ui/datetime";
import { StatusBadge } from "../../status-badge";
import { Page } from "@/components/ui/page";
import { ButtonLink } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export default async function ContributionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ type: string; revisionId: string }>;
  searchParams: Promise<{ published?: string }>;
}) {
  const [{ type, revisionId }, query] = await Promise.all([params, searchParams]);
  if (!isContributionType(type)) notFound();
  const [detail, options] = await Promise.all([getContribution(type, revisionId), getContributionOptions()]);
  const published = detail.status === "Published";
  const successor = !published && detail.currentPublishedRevisionId !== null;
  const hasAttachments = type === "teaching_note" || type === "material";
  const state: ManagementViewState = published
    ? (detail.successorDraftRevisionId ? "published_with_draft" : "published")
    : "draft";

  return <Page width="content">
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-hairline pb-6">
      <div className="min-w-0">
        <p className="eyebrow">{contributionTypeLabel(type)} · Versión {detail.revisionNumber}</p>
        <h1 className="mt-2 text-4xl">{published ? "Contenido publicado" : "Editar borrador"}</h1>
        <p className="mt-3 max-w-2xl text-body text-ink-muted">
          {published
            ? "Esta es la versión vigente en la biblioteca. Se conserva tal como se publicó."
            : "Los campos marcados con * son necesarios para guardar el borrador."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge state={state} />
        <ButtonLink href="/app/contributions" variant="secondary" size="sm">Volver a administrar contenido</ButtonLink>
      </div>
    </header>

    <div className="mt-6 grid gap-3">
      {query.published === "1" && published && <Notice tone="success">
        Publicado correctamente. Esta versión ya es la vigente en la biblioteca.
      </Notice>}
      {successor && <Notice tone="info">
        Estás editando la versión {detail.revisionNumber} sin cambiar la versión publicada. La biblioteca seguirá mostrando la versión anterior hasta que publiques este borrador.
      </Notice>}
      {published && detail.successorDraftRevisionId && <Notice tone="info">
        Esta versión sigue publicada mientras se prepara una nueva versión. <Link href={`/app/contributions/${type}/${detail.successorDraftRevisionId}`} prefetch={false} className="font-bold">Abrir el borrador existente</Link>.
      </Notice>}
    </div>

    {/*
      Editing on one side, lifecycle and governance on the other. Below the
      explorer breakpoint the rail stacks under the form, which keeps the reading
      order "what this content says" then "what may be done to it".
    */}
    <div className="mt-6 items-start gap-5 explorer:grid explorer:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0 space-y-4">
        <ContributionForm type={type} options={options} detail={detail} readOnly={published} />
        {hasAttachments && <AttachmentManager
          type={type}
          revisionId={revisionId}
          attachments={detail.attachments}
          readOnly={published}
        />}
      </div>

      <aside className="mt-4 space-y-4 explorer:sticky explorer:top-20 explorer:mt-0 explorer:max-h-[calc(100dvh-6rem)] explorer:overflow-y-auto">
        <SidePanel title="Estado">
          <dl>
            <PanelRow label="Versión">{detail.revisionNumber}</PanelRow>
            <PanelRow label="Situación"><StatusBadge state={state} /></PanelRow>
            {published && detail.publishedAt && <PanelRow label="Publicada">
              <span className="font-normal text-ink-soft">{formatGovernanceTimestamp(detail.publishedAt)}</span>
            </PanelRow>}
            {successor && detail.currentPublishedRevisionId && <PanelRow label="Versión vigente">
              <Link href={`/app/contributions/${type}/${detail.currentPublishedRevisionId}`} prefetch={false}>
                Ver la versión publicada
              </Link>
            </PanelRow>}
          </dl>
        </SidePanel>

        {!published && <SidePanel
          title="Publicación"
          description="Publicar hace que esta versión sea la vigente en la biblioteca para toda la red."
        >
          <PublishAction type={type} revisionId={revisionId} />
        </SidePanel>}

        {published && !detail.successorDraftRevisionId && <SidePanel
          title="Nueva versión"
          description="El contenido publicado no se edita en su lugar: se trabaja sobre una nueva versión en borrador."
        >
          <SuccessorAction type={type} contentId={detail.contentId} />
        </SidePanel>}

        {/*
          Governance is kept apart from the editing controls: archiving retires the whole
          stable identity, it is not another way to edit this revision. Eligibility shown
          here is advisory — archive_governed_content re-checks Draft state, dependencies
          and live Admin authority inside its own transaction.
        */}
        {published && <SidePanel id="governance-title" title="Gobernanza">
          <div className="grid gap-3">
            <Link href={`/app/contributions/history?type=${type}&content=${detail.contentId}`} prefetch={false} className="text-control font-bold">
              Ver historial
            </Link>
            {!detail.successorDraftRevisionId && <ArchiveAction type={type} contentId={detail.contentId} />}
          </div>
          {detail.successorDraftRevisionId && <p className="mt-3 text-body text-ink-soft">
            Este contenido no se puede archivar mientras exista una nueva versión en borrador. Publica o
            elimina ese borrador antes de archivarlo.
          </p>}
        </SidePanel>}
      </aside>
    </div>
  </Page>;
}
