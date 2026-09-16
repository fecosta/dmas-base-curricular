import Link from "next/link";
import { getReference } from "@/lib/curriculum/queries";
import { PublishedAttachments } from "@/app/app/library/published-attachments";
import { Page, Container } from "@/components/ui/page";
import { Badge } from "@/components/ui/badge";
import { EmptyNote } from "@/components/ui/empty-state";

export default async function ReferencePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const reference = await getReference(type, id);
  const externalUrl = reference.entityType === "material" ? reference.sourceUrl : reference.websiteUrl;
  const kind = reference.entityType === "material" ? "Material o estudio" : "Institución o centro de referencia";

  return <Page width="bleed">
    <div className="on-dark relative isolate overflow-hidden bg-night text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_120%_at_12%_0%,#151a6b_0%,transparent_60%),radial-gradient(60%_120%_at_85%_20%,#2a1350_0%,transparent_55%)]" />
      <Container width="content" className="py-10 lg:py-14">
        <Link href="/app/library" prefetch={false} className="text-sm font-bold">← Volver a referencias</Link>
        <p className="eyebrow mt-8 text-accent">{kind}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl">{reference.title}</h1>
      </Container>
    </div>

    <Container width="content" className="grid gap-10 py-10 lg:grid-cols-[1fr_18rem] lg:py-14">
      <div className="min-w-0">
        {reference.description
          ? <p className="max-w-2xl text-lg text-ink-soft">{reference.description}</p>
          : <EmptyNote>Esta referencia no tiene descripción publicada.</EmptyNote>}
        {externalUrl && <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 font-bold text-white no-underline shadow-raised hover:bg-primary-strong hover:text-white hover:no-underline"
        >Abrir sitio externo</a>}
        {reference.entityType === "material" && <PublishedAttachments attachments={reference.attachments ?? []} />}
      </div>

      <dl className="space-y-5 rounded-lg border border-hairline bg-surface p-5 shadow-card lg:self-start">
        <div>
          <dt className="filter-label">Tipo</dt>
          <dd className="mt-1 font-bold">{reference.classification}</dd>
        </div>
        {reference.countryOrScope && <div>
          <dt className="filter-label">País o alcance</dt>
          <dd className="mt-1">{reference.countryOrScope}</dd>
        </div>}
        {reference.sourceOrInstitution && <div>
          <dt className="filter-label">Fuente o institución</dt>
          <dd className="mt-1">{reference.sourceOrInstitution}</dd>
        </div>}
        {reference.themes.length > 0 && <div>
          <dt className="filter-label">Temas</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {reference.themes.map((theme) => <Badge key={theme} tone="warning">{theme}</Badge>)}
          </dd>
        </div>}
      </dl>
    </Container>
  </Page>;
}
