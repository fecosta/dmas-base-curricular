import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { contributionTypes } from "@/lib/contributions/types";
import { contributionFamilies } from "@/lib/contributions/families";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";

export default async function NewContributionPage() {
  await requireAccess("Admin");
  const byType = new Map(contributionTypes.map((item) => [item.type, item]));

  return <Page width="content">
    <PageHeader
      eyebrow="Gestión editorial"
      title="Crear contenido"
      lede="Selecciona el tipo de conocimiento que deseas crear."
    />
    {/* Grouping is information architecture only: same types, same routes,
        same creation semantics and the same Admin authorization. */}
    <div className="mt-10 space-y-10">
      {contributionFamilies.map((family) => <section key={family.id} aria-labelledby={`family-${family.id}`}>
        <SectionHeader title={family.label} id={`family-${family.id}`} className="mb-2" />
        <p className="text-sm text-ink-muted">{family.description}</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {family.types.map((type) => {
            const item = byType.get(type)!;
            return <Link
              key={item.type}
              href={`/app/contributions/new/${item.type}`}
              prefetch={false}
              className="rounded-lg border border-hairline bg-surface p-6 no-underline shadow-card transition-colors hover:border-primary/40 hover:bg-inset hover:no-underline"
            >
              <h3 className="text-lg text-ink">{item.label}</h3>
              <p className="mt-3 text-sm text-ink-muted">{item.description}</p>
            </Link>;
          })}
        </div>
      </section>)}
    </div>
  </Page>;
}
