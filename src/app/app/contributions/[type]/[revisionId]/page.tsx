import Link from "next/link";
import { notFound } from "next/navigation";
import { AttachmentManager } from "../../attachment-manager";
import { ContributionForm } from "../../contribution-form";
import { PublishAction, SuccessorAction } from "../../management-actions";
import { getContribution, getContributionOptions } from "@/lib/contributions/queries";
import { contributionTypeLabel, isContributionType } from "@/lib/contributions/types";
import { StatusBadge } from "../../status-badge";

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
  return <main id="contenido" className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{contributionTypeLabel(type)} · Versión {detail.revisionNumber}</p><h1 className="mt-2 text-4xl text-[#173f3a]">{published ? "Contenido publicado" : "Editar borrador"}</h1></div><StatusBadge state={published ? (detail.successorDraftRevisionId ? "published_with_draft" : "published") : "draft"} /></div>
    {query.published === "1" && published && <p role="status" className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 font-semibold text-emerald-900">Publicado correctamente. Esta versión ya es la vigente en la biblioteca.</p>}
    {successor && <p className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-950">Estás editando la versión {detail.revisionNumber} sin cambiar la versión publicada. La biblioteca seguirá mostrando la versión anterior hasta que publiques este borrador.</p>}
    {published && detail.successorDraftRevisionId && <p className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-950">Esta versión sigue publicada mientras se prepara una nueva versión. <Link href={`/app/contributions/${type}/${detail.successorDraftRevisionId}`} prefetch={false} className="font-bold">Abrir el borrador existente</Link>.</p>}
    {published && !detail.successorDraftRevisionId && <p className="mt-5 text-slate-700">Los campos publicados son de solo lectura. Para modificarlos, crea una nueva versión.</p>}
    <ContributionForm type={type} options={options} detail={detail} readOnly={published} />
    {(type === "teaching_note" || type === "material") && <AttachmentManager type={type} revisionId={revisionId} attachments={detail.attachments} readOnly={published} />}
    {!published && <PublishAction type={type} revisionId={revisionId} />}
    {published && !detail.successorDraftRevisionId && <SuccessorAction type={type} contentId={detail.contentId} />}
  </main>;
}
