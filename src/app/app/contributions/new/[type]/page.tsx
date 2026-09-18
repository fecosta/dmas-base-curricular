import { notFound } from "next/navigation";
import { ContributionForm } from "../../contribution-form";
import { SidePanel } from "../../panels";
import { requireAccess } from "@/lib/auth/access";
import { getContributionOptions } from "@/lib/contributions/queries";
import { contributionTypeLabel, isContributionType } from "@/lib/contributions/types";
import { Page } from "@/components/ui/page";
import { ButtonLink } from "@/components/ui/button";

export default async function NewContributionTypePage({ params }: { params: Promise<{ type: string }> }) {
  await requireAccess("Admin");
  const { type } = await params;
  if (!isContributionType(type)) notFound();
  const options = await getContributionOptions();
  const acceptsFiles = type === "teaching_note" || type === "material";

  return <Page width="content">
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-hairline pb-6">
      <div className="min-w-0">
        <p className="eyebrow">Nuevo contenido</p>
        <h1 className="mt-2 text-4xl">{contributionTypeLabel(type)}</h1>
        <p className="mt-3 max-w-2xl text-body text-ink-muted">
          Los campos marcados con * son necesarios para guardar el borrador.
        </p>
      </div>
      <ButtonLink href="/app/contributions/new" variant="secondary" size="sm">Cambiar tipo de contenido</ButtonLink>
    </header>

    {/* Same composition as an existing Draft, so the two do not read as
        different products: the form on the left, context on the right. */}
    <div className="mt-6 items-start gap-5 explorer:grid explorer:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="min-w-0">
        <ContributionForm type={type} options={options} />
      </div>

      <aside className="mt-4 explorer:sticky explorer:top-20 explorer:mt-0">
        <SidePanel title="Cómo continúa" description="La creación de contenido tiene dos pasos separados.">
          <ol className="grid list-decimal gap-3 ps-4 text-body text-ink-soft marker:font-bold marker:text-primary">
            <li>Guarda el borrador. Queda accesible para cualquier administradora o administrador y no es visible en la biblioteca.</li>
            {acceptsFiles && <li>Adjunta los archivos privados, disponibles una vez guardado el borrador.</li>}
            <li>Publica cuando el contenido esté completo. Recién entonces la red lo ve.</li>
          </ol>
        </SidePanel>
      </aside>
    </div>
  </Page>;
}
