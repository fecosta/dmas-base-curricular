import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { contributionTypes } from "@/lib/contributions/types";
import { contributionFamilies } from "@/lib/contributions/families";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";

export default async function NewContributionPage() {
  await requireAccess("Admin");
  const byType = new Map(contributionTypes.map((item) => [item.type, item]));
  // Continuous numbering in the order the families actually render, as the
  // reference numbers the choices it offers. Decorative ordering only: it is not
  // a sequence, and every option leads to the same canonical create route it
  // always did.
  const order = new Map(contributionFamilies
    .flatMap((family) => family.types)
    .map((type, index) => [type, String(index + 1).padStart(2, "0")]));

  return <Page width="content">
    <PageHeader
      eyebrow="Gestión editorial"
      title="Crear contenido"
      lede="Selecciona el tipo de conocimiento que deseas crear. Cada tipo abre su propio formulario y se guarda como borrador."
      actions={<ButtonLink href="/app/contributions" variant="secondary">Volver a administrar contenido</ButtonLink>}
    />
    {/* Grouping is information architecture only: same types, same routes,
        same creation semantics and the same Admin authorization. */}
    <div className="mt-10 space-y-10">
      {contributionFamilies.map((family) => <section key={family.id} aria-labelledby={`family-${family.id}`}>
        <SectionHeader title={family.label} id={`family-${family.id}`} className="mb-2" />
        <p className="max-w-2xl text-body text-ink-muted">{family.description}</p>
        <div className="mt-5 grid gap-3 grid-cols-[repeat(auto-fill,minmax(min(280px,100%),1fr))]">
          {family.types.map((type) => {
            const item = byType.get(type)!;
            return <Link
              key={item.type}
              href={`/app/contributions/new/${item.type}`}
              prefetch={false}
              className="group flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-5 no-underline shadow-card transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-primary hover:no-underline hover:shadow-panel"
            >
              <span className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-primary/10 text-meta font-extrabold tracking-normal text-primary transition-colors group-hover:bg-primary group-hover:text-white"
                >{order.get(item.type)}</span>
                <span className="min-w-0 text-card font-extrabold text-ink">{item.label}</span>
              </span>
              <span className="text-control leading-relaxed text-ink-muted">{item.description}</span>
              <span aria-hidden="true" className="mt-2 border-t border-hairline pt-3 text-meta font-extrabold tracking-normal text-primary">
                Crear →
              </span>
            </Link>;
          })}
        </div>
      </section>)}
    </div>
  </Page>;
}
