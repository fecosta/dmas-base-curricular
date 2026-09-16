import { notFound } from "next/navigation";
import { ContributionForm } from "../../contribution-form";
import { requireAccess } from "@/lib/auth/access";
import { getContributionOptions } from "@/lib/contributions/queries";
import { contributionTypeLabel, isContributionType } from "@/lib/contributions/types";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewContributionTypePage({ params }: { params: Promise<{ type: string }> }) {
  await requireAccess("Admin");
  const { type } = await params;
  if (!isContributionType(type)) notFound();
  const options = await getContributionOptions();

  return <Page width="narrow">
    <PageHeader
      eyebrow="Nuevo contenido"
      title={contributionTypeLabel(type)}
      lede="Los campos marcados con * son necesarios para guardar el borrador."
    />
    <ContributionForm type={type} options={options} />
  </Page>;
}
