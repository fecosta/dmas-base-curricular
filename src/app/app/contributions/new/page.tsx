import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { contributionTypes } from "@/lib/contributions/types";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";

export default async function NewContributionPage() {
  await requireAccess("Admin");

  return <Page width="content">
    <PageHeader
      eyebrow="Gestión editorial"
      title="Crear contenido"
      lede="Selecciona el tipo de conocimiento que deseas crear."
    />
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {contributionTypes.map((item) => <Link
        key={item.type}
        href={`/app/contributions/new/${item.type}`}
        prefetch={false}
        className="rounded-lg border border-hairline bg-surface p-6 no-underline shadow-card transition-colors hover:border-primary/40 hover:bg-inset hover:no-underline"
      >
        <h2 className="text-lg text-ink">{item.label}</h2>
        <p className="mt-3 text-ink-muted">{item.description}</p>
      </Link>)}
    </div>
  </Page>;
}
