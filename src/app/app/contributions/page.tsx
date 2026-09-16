import Link from "next/link";
import { listArchivedContent, listManagedContent } from "@/lib/contributions/queries";
import {
  archivedContentTitle,
  contributionTypeLabel,
  contributionTypes,
  isContributionType,
  type ArchivedContentSummary,
  type ContributionType,
  type ManagementViewState,
} from "@/lib/contributions/types";
import { contributionFamilies, contributionTypePlural } from "@/lib/contributions/families";
import { formatGovernanceTimestamp } from "@/lib/ui/datetime";
import { RestoreAction } from "./governance-actions";
import { StatusBadge } from "./status-badge";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { Button, ButtonLink } from "@/components/ui/button";
import { SectionHeader, resultCount } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";

const states: { value: ManagementViewState; label: string }[] = [
  { value: "published", label: "Publicado" },
  { value: "draft", label: "Borrador" },
  { value: "published_with_draft", label: "Nueva versión en borrador" },
  { value: "archived", label: "Archivado" },
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

function ArchivedEntry({ entry }: { entry: ArchivedContentSummary }) {
  const title = archivedContentTitle(entry);
  return <Card as="article" className="flex flex-wrap items-center justify-between gap-5 p-5">
    {/* A flex basis rather than flex-1: the archived row carries two controls, so on a
        narrow viewport the action cluster has to wrap below the title instead of
        squeezing it into a column a few words wide. */}
    <div className="min-w-0 flex-[1_1_18rem]">
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge state="archived" />
        <p className="text-sm text-ink-muted">
          {contributionTypeLabel(entry.type)}
          {entry.currentPublishedRevisionNumber ? ` · Versión ${entry.currentPublishedRevisionNumber} publicada` : ""}
          {` · Archivado el ${formatGovernanceTimestamp(entry.archivedAt)}`}
        </p>
      </div>
      <h4 className="mt-2 text-lg">{title}</h4>
      {/* An archived identity whose published metadata cannot be resolved still has
          to be restorable, so it is shown with its stable id rather than dropped. */}
      {entry.title === null && <p className="mt-1 text-sm text-ink-muted">Identificador: {entry.contentId}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-4">
      <Link
        href={`/app/contributions/history?type=${entry.type}&content=${entry.contentId}`}
        prefetch={false}
        aria-label={`Ver historial de ${title}`}
        className="text-sm font-bold"
      >Ver historial</Link>
      <RestoreAction type={entry.type} contentId={entry.contentId} title={title} />
    </div>
  </Card>;
}

export default async function ContributionsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const search = single(query, "q");
  const typeParam = single(query, "type");
  const stateParam = single(query, "state");
  const type = isContributionType(typeParam) ? typeParam : undefined;
  const viewState = states.some((option) => option.value === stateParam) ? stateParam as ManagementViewState : undefined;
  const archivedView = viewState === "archived";
  const filtered = Boolean(search || type || viewState);

  const baseHref = (overrides: { type?: string; state?: string }) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    const nextState = overrides.state ?? stateParam;
    if (nextState) params.set("state", nextState);
    const nextType = overrides.type ?? typeParam;
    if (nextType) params.set("type", nextType);
    const queryString = params.toString();
    return queryString ? `/app/contributions?${queryString}` : "/app/contributions";
  };

  const filters = <form method="get" className="mt-8 rounded-lg border border-hairline bg-surface p-5 shadow-card">
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
    </div>
  </form>;

  const header = <PageHeader
    eyebrow="Gestión editorial"
    title="Administrar contenido"
    lede="Crea, edita y publica el conocimiento curricular de la red."
    actions={<>
      <ButtonLink href="/app/contributions/history" variant="secondary">Ver historial</ButtonLink>
      <ButtonLink href="/app/contributions/new">Crear contenido</ButtonLink>
    </>}
  />;

  if (archivedView) {
    // Archived identities are invisible to every active-management policy by design,
    // so this branch reads the dedicated Admin RPC instead. The two backends are not
    // merged: their pagination contracts differ and a union would unbound one of them.
    const cursorAt = single(query, "before_at");
    const cursorId = single(query, "before_id");
    const cursorType = single(query, "before_type");
    const cursor = cursorAt && cursorId && isContributionType(cursorType)
      ? { archivedAt: cursorAt, contentId: cursorId, contentType: cursorType }
      : null;
    const { entries, nextCursor } = await listArchivedContent({ type, cursor });

    const morePath = nextCursor
      ? (() => {
          const params = new URLSearchParams();
          params.set("state", "archived");
          if (typeParam) params.set("type", typeParam);
          // All three keyset components travel together; dropping one would let a
          // page boundary skip a tied row.
          params.set("before_at", nextCursor.archivedAt);
          params.set("before_id", nextCursor.contentId);
          params.set("before_type", nextCursor.contentType);
          return `/app/contributions?${params.toString()}`;
        })()
      : null;

    return <Page width="content">
      {header}
      {filters}
      {search && <Notice tone="info" className="mt-6">
        La búsqueda por texto todavía no está disponible en el contenido archivado. Se muestra el contenido
        archivado que coincide con el tipo seleccionado.
      </Notice>}
      <section aria-labelledby="archived-title" className="mt-10">
        <SectionHeader title="Contenido archivado" id="archived-title" meta={resultCount(entries.length)} />
        {entries.length === 0
          ? <EmptyState
              title="Sin contenido archivado"
              description="El contenido archivado deja de estar disponible para las personas lectoras y puede restaurarse desde aquí."
            />
          : <div className="grid gap-3">
              {entries.map((entry) => <ArchivedEntry key={`${entry.type}-${entry.contentId}`} entry={entry} />)}
            </div>}
      </section>
      {cursor && <p className="mt-6">
        <Link href={baseHref({ state: "archived" })} prefetch={false} className="text-sm font-bold">Volver al contenido archivado más reciente</Link>
      </p>}
      {morePath && <p className="mt-6">
        <Link href={morePath} prefetch={false} className="font-bold">Ver más contenido archivado</Link>
      </p>}
    </Page>;
  }

  // The archived branch returned above, so what reaches the active listing is
  // narrowed to a revision-derived ManagementState by the compiler.
  const contents = await listManagedContent({ query: search, type, state: viewState });
  const byType = new Map<ContributionType, typeof contents>();
  for (const item of contents) {
    if (!byType.has(item.type)) byType.set(item.type, []);
    byType.get(item.type)!.push(item);
  }

  // Under "Todos los estados" archived content stays discoverable through a bounded
  // preview rather than an artificial union with the active listing.
  const archivedPreview = viewState ? null : await listArchivedContent({ type, pageSize: PREVIEW });

  return <Page width="content">
    {header}
    {filters}
    <p className="mt-4 text-sm text-ink-muted">{resultCount(contents.length)}</p>

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
                      <Link href={baseHref({ type: item })} prefetch={false} className="text-sm font-bold">
                        Ver {contributionTypePlural(item).toLowerCase()} ({rows.length})
                      </Link>
                    </p>}
                  </section>;
                })}
              </div>
            </section>;
          })}
        </div>}

    {archivedPreview && archivedPreview.entries.length > 0 && <section aria-labelledby="archived-preview-title" className="mt-12">
      <SectionHeader title="Contenido archivado" id="archived-preview-title" />
      <div className="grid gap-3">
        {archivedPreview.entries.map((entry) => <ArchivedEntry key={`${entry.type}-${entry.contentId}`} entry={entry} />)}
      </div>
      <p className="mt-3">
        <Link href={baseHref({ state: "archived" })} prefetch={false} className="text-sm font-bold">Ver todo el contenido archivado</Link>
      </p>
    </section>}
  </Page>;
}
