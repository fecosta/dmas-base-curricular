import { notFound } from "next/navigation";
import { AttachmentManager } from "../../attachment-manager";
import { ContributionForm } from "../../contribution-form";
import { LifecycleActions } from "../../lifecycle-actions";
import { getContribution, getContributionOptions } from "@/lib/contributions/queries";
import { contributionTypeLabel, isContributionType } from "@/lib/contributions/types";

export default async function ContributionDetailPage({ params }: { params: Promise<{ type: string; revisionId: string }> }) {
  const { type, revisionId } = await params;
  if (!isContributionType(type)) notFound();
  const detail = await getContribution(type, revisionId);
  const options = await getContributionOptions();
  const submitted = detail.status === "Submitted";
  return <main id="contenido" className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow">{contributionTypeLabel(type)}</p><h1 className="mt-2 text-4xl text-[#173f3a]">{submitted ? "Enviado para revisión" : "Editar borrador"}</h1></div><span className={`rounded-full px-4 py-2 text-sm font-bold ${submitted ? "bg-blue-100 text-blue-900" : "bg-amber-100 text-amber-900"}`}>{submitted ? "Enviado" : "Borrador"}</span></div>
    {submitted && <p className="mt-5 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-900">Esta contribución fue enviada para revisión y ahora es de solo lectura.</p>}
    <ContributionForm type={type} options={options} detail={detail} readOnly={submitted} />
    {(type === "teaching_note" || type === "material") && <AttachmentManager type={type} revisionId={revisionId} attachments={detail.attachments} readOnly={submitted} />}
    {!submitted && <LifecycleActions type={type} revisionId={revisionId} />}
  </main>;
}
