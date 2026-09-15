import { notFound } from "next/navigation";
import { ContributionForm } from "../../contribution-form";
import { requireAccess } from "@/lib/auth/access";
import { getContributionOptions } from "@/lib/contributions/queries";
import { contributionTypeLabel, isContributionType } from "@/lib/contributions/types";

export default async function NewContributionTypePage({ params }: { params: Promise<{ type: string }> }) {
  await requireAccess("Admin");
  const { type } = await params;
  if (!isContributionType(type)) notFound();
  const options = await getContributionOptions();
  return <main id="contenido" className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
    <p className="eyebrow">Nuevo contenido</p><h1 className="mt-2 text-4xl text-[#173f3a]">{contributionTypeLabel(type)}</h1>
    <p className="mt-3 text-slate-700">Los campos marcados con * son necesarios para guardar el borrador.</p>
    <ContributionForm type={type} options={options} />
  </main>;
}
