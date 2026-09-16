import Link from "next/link";
import { notFound } from "next/navigation";
import { AttachmentManager } from "../../attachment-manager";
import { ContributionForm } from "../../contribution-form";
import { PublishAction, SuccessorAction } from "../../management-actions";
import { getContribution, getContributionOptions } from "@/lib/contributions/queries";
import { contributionTypeLabel, isContributionType } from "@/lib/contributions/types";
import { StatusBadge } from "../../status-badge";
import { Page } from "@/components/ui/page";
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

  return <Page width="narrow">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-6">
      <div className="min-w-0">
        <p className="eyebrow">{contributionTypeLabel(type)} · Versión {detail.revisionNumber}</p>
        <h1 className="mt-2 text-4xl">{published ? "Contenido publicado" : "Editar borrador"}</h1>
      </div>
      <StatusBadge state={published ? (detail.successorDraftRevisionId ? "published_with_draft" : "published") : "draft"} />
    </header>

    <div className="mt-6 grid gap-4">
      {query.published === "1" && published && <Notice tone="success">
        Publicado correctamente. Esta versión ya es la vigente en la biblioteca.
      </Notice>}
      {successor && <Notice tone="info">
        Estás editando la versión {detail.revisionNumber} sin cambiar la versión publicada. La biblioteca seguirá mostrando la versión anterior hasta que publiques este borrador.
      </Notice>}
      {published && detail.successorDraftRevisionId && <Notice tone="info">
        Esta versión sigue publicada mientras se prepara una nueva versión. <Link href={`/app/contributions/${type}/${detail.successorDraftRevisionId}`} prefetch={false} className="font-bold">Abrir el borrador existente</Link>.
      </Notice>}
      {published && !detail.successorDraftRevisionId && <p className="text-ink-soft">
        Los campos publicados son de solo lectura. Para modificarlos, crea una nueva versión.
      </p>}
    </div>

    <ContributionForm type={type} options={options} detail={detail} readOnly={published} />
    {(type === "teaching_note" || type === "material") && <AttachmentManager type={type} revisionId={revisionId} attachments={detail.attachments} readOnly={published} />}
    {!published && <PublishAction type={type} revisionId={revisionId} />}
    {published && !detail.successorDraftRevisionId && <SuccessorAction type={type} contentId={detail.contentId} />}
  </Page>;
}
