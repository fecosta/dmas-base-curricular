import Link from "next/link";
import { listManagedContent } from "@/lib/contributions/queries";
import { contributionTypes, isContributionType, type ContributionType, type ManagementState } from "@/lib/contributions/types";
import { contributionFamilies, contributionTypePlural } from "@/lib/contributions/families";
import { StatusBadge } from "./status-badge";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { SectionHeader, resultCount } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";

const states: { value: ManagementState; label: string }[] = [
  { value: "published", label: "Publicado" },
  { value: "draft", label: "Borrador" },
  { value: "published_with_draft", label: "Nueva versión en borrador" },
];

type Query = { [key: string]: string | string[] | undefined };

// Without a type filter the page is an overview: each family shows a bounded
// slice per type with an explicit link to that type's complete filtered list,
// so nothing becomes unreachable at hundreds of records.
const PREVIEW = 5;

function single(query: Query, key: string) {
  const value = query[key];
  return typeof value === "string" ? value : "";
}

export default async function ContributionsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const search = single(query, "q");
  const typeParam = single(query, "type");
  const stateParam = single(query, "state");
  const type = isContributionType(typeParam) ? typeParam : undefined;
  const state = states.some((option) => option.value === stateParam) ? stateParam as ManagementState : undefined;

  const contents = await listManagedContent({ query: search, type, state });
  const byType = new Map<ContributionType, typeof contents>();
  for (const item of contents) {
    if (!byType.has(item.type)) byType.set(item.type, []);
    byType.get(item.type)!.push(item);
  }
  const filtered = Boolean(search || type || state);
  const manageHref = (overrides: { type?: string }) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (state) params.set("state", state);
    const nextType = overrides.type ?? typeParam;
    if (nextType) params.set("type", nextType);
    const queryString = params.toString();
    return queryString ? `/app/contributions?${queryString}` : "/app/contributions";
  };

  return <Page width="content">
    <PageHeader
      eyebrow="Gestión editorial"
      title="Administrar contenido"
      lede="Crea, edita y publica el conocimiento curricular de la red."
      actions={<ButtonLink href="/app/contributions/new">Crear contenido</ButtonLink>}
    />

    {/* Filters are a plain GET form so the management view stays linkable and
        the server does the narrowing. */}
    <form method="get" className="mt-8 rounded-lg border border-hairline bg-surface p-5 shadow-card">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
        <Field label="Buscar contenido">
          <input name="q" defaultValue={search} placeholder="Título del contenido…" />
        </Field>
        <Field label="Tipo de contenido">
          <select name="type" defaultValue={typeParam}>
            <option value="">Todos los tipos</option>
            {contributionTypes.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Estado">
          <select name="state" defaultValue={stateParam}>
            <option value="">Todos los estados</option>
            {states.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit">Aplicar filtros</Button>
        {filtered && <Link href="/app/contributions" prefetch={false} className="text-sm font-bold">Limpiar</Link>}
        <span className="ml-auto text-sm text-ink-muted">{resultCount(contents.length)}</span>
      </div>
    </form>

    {contents.length === 0
      ? <EmptyState
          className="mt-10"
          title={filtered ? "Sin resultados para estos filtros" : "Todavía no hay contenido administrable"}
          description={filtered
            ? "Ajusta la búsqueda, el tipo o el estado para encontrar el contenido."
            : "Crea un borrador para comenzar: usa Crear contenido en la parte superior de esta página."}
        />
      : <div className="mt-10 space-y-12">
          {contributionFamilies.map((family) => {
            const familyTypes = family.types.filter((item) => (byType.get(item) ?? []).length > 0);
            if (familyTypes.length === 0) return null;
            const total = familyTypes.reduce((sum, item) => sum + (byType.get(item) ?? []).length, 0);
            return <section key={family.id} aria-labelledby={`family-${family.id}`}>
              <SectionHeader title={family.label} id={`family-${family.id}`} meta={resultCount(total)} />
              <div className="space-y-8">
                {familyTypes.map((item) => {
                  const rows = byType.get(item) ?? [];
                  const shown = type ? rows : rows.slice(0, PREVIEW);
                  return <section key={item} aria-labelledby={`type-${item}`}>
                    <h3 id={`type-${item}`} className="text-sm font-extrabold tracking-[0.04em] text-ink-soft">
                      {contributionTypePlural(item)} <span className="font-normal text-ink-muted">({rows.length})</span>
                    </h3>
                    <div className="mt-3 grid gap-3">
                      {shown.map((row) => <Card key={`${row.type}-${row.contentId}`} as="article" className="flex flex-wrap items-center justify-between gap-5 p-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <StatusBadge state={row.state} />
                            <p className="text-sm text-ink-muted">
                              {row.currentPublishedRevisionNumber && `Versión ${row.currentPublishedRevisionNumber} publicada`}
                              {row.currentPublishedRevisionNumber && row.draftRevisionNumber ? " · " : ""}
                              {row.draftRevisionNumber && `Versión ${row.draftRevisionNumber} en borrador`}
                            </p>
                          </div>
                          <h4 className="mt-2 text-lg">{row.title}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          {row.currentPublishedRevisionId && <Link href={`/app/contributions/${row.type}/${row.currentPublishedRevisionId}`} prefetch={false} className="text-sm font-bold">Ver versión publicada</Link>}
                          {row.draftRevisionId && <ButtonLink href={`/app/contributions/${row.type}/${row.draftRevisionId}`} size="sm" variant="secondary">Editar borrador</ButtonLink>}
                        </div>
                      </Card>)}
                    </div>
                    {shown.length < rows.length && <p className="mt-3">
                      <Link href={manageHref({ type: item })} prefetch={false} className="text-sm font-bold">
                        Ver {contributionTypePlural(item).toLowerCase()} ({rows.length})
                      </Link>
                    </p>}
                  </section>;
                })}
              </div>
            </section>;
          })}
        </div>}
  </Page>;
}
