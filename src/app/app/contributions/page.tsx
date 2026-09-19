import Link from "next/link";
import { listArchivedContent, listManagedContent } from "@/lib/contributions/queries";
import {
  archivedContentTitle,
  contributionTypeLabel,
  contributionTypes,
  isContributionType,
  type ArchivedContentSummary,
  type ContributionType,
  type ManagementState,
  type ManagementViewState,
} from "@/lib/contributions/types";
import { contributionFamilies, contributionTypePlural } from "@/lib/contributions/families";
import { formatGovernanceTimestamp } from "@/lib/ui/datetime";
import { RestoreAction } from "./governance-actions";
import { StatusBadge } from "./status-badge";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { Card, type Tone } from "@/components/ui/card";
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

/**
 * Colour reinforces the state but never carries it: every row also states its
 * situation in words through StatusBadge.
 */
const stateTone: Record<ManagementState, Tone> = {
  draft: "warning",
  published: "success",
  published_with_draft: "primary",
};

type Query = { [key: string]: string | string[] | undefined };

/** One removable narrowing currently applied to the listing. */
type AppliedManagementFilter = { key: string; label: string; href: string; remove: string };

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
  return <Card as="article" className="flex flex-wrap items-start justify-between gap-x-5 gap-y-4 p-5">
    {/* A flex basis rather than flex-1: the archived row carries two controls, so on a
        narrow viewport the action cluster has to wrap below the title instead of
        squeezing it into a column a few words wide. */}
    <div className="min-w-0 flex-[1_1_18rem]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge state="archived" />
        <p className="text-control text-ink-muted">
          {contributionTypeLabel(entry.type)}
          {entry.currentPublishedRevisionNumber ? ` · Versión ${entry.currentPublishedRevisionNumber} publicada` : ""}
          {` · Archivado el ${formatGovernanceTimestamp(entry.archivedAt)}`}
        </p>
      </div>
      {/* h3, not h4: both archived listings sit directly under the section's own
          h2, unlike the active listing where a per-type h3 comes between. */}
      <h3 className="mt-2 text-card font-bold">{title}</h3>
      {/* An archived identity whose published metadata cannot be resolved still has
          to be restorable, so it is shown with its stable id rather than dropped. */}
      {entry.title === null && <p className="mt-1 text-control text-ink-muted">Identificador: {entry.contentId}</p>}
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/app/contributions/history?type=${entry.type}&content=${entry.contentId}`}
        prefetch={false}
        aria-label={`Ver historial de ${title}`}
        className="text-control font-bold"
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

  const baseHref = (overrides: { q?: string; type?: string; state?: string }) => {
    const params = new URLSearchParams();
    const nextSearch = overrides.q ?? search;
    if (nextSearch) params.set("q", nextSearch);
    const nextState = overrides.state ?? stateParam;
    if (nextState) params.set("state", nextState);
    const nextType = overrides.type ?? typeParam;
    if (nextType) params.set("type", nextType);
    const queryString = params.toString();
    return queryString ? `/app/contributions?${queryString}` : "/app/contributions";
  };

  // What is currently narrowing the listing, as removable links. Removal is as
  // URL-driven as application: each chip points at this page without that one
  // parameter, which also drops any archived keyset cursor, as the form does.
  const applied = [
    search && { key: "q", label: `«${search}»`, href: baseHref({ q: "" }), remove: `Quitar la búsqueda ${search}` },
    type && { key: "type", label: contributionTypeLabel(type), href: baseHref({ type: "" }), remove: `Quitar el filtro de tipo ${contributionTypeLabel(type)}` },
    viewState && {
      key: "state",
      label: states.find((option) => option.value === viewState)!.label,
      href: baseHref({ state: "" }),
      remove: `Quitar el filtro de estado ${states.find((option) => option.value === viewState)!.label}`,
    },
  ].filter((item): item is AppliedManagementFilter => typeof item === "object");

  const filters = <div className="mt-8">
    <form method="get" className="rounded-xl border border-hairline bg-surface p-4 shadow-panel explorer:p-5">
      <div className="grid gap-4 explorer:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] explorer:items-end">
        <Field label="Buscar contenido">
          <input type="search" name="q" defaultValue={search} placeholder="Título del contenido…" />
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
        <Button type="submit" size="sm" className="mt-2 explorer:mt-0">Aplicar filtros</Button>
      </div>
    </form>

    {applied.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="filter-label">Filtros activos</span>
      {applied.map((item) => <Link
        key={item.key}
        href={item.href}
        prefetch={false}
        aria-label={item.remove}
        className="inline-flex max-w-full items-center gap-2 rounded-full border border-hairline-strong bg-surface px-3 py-1.5 text-control font-semibold text-ink-soft no-underline shadow-card transition-colors hover:border-primary hover:text-primary hover:no-underline"
      >
        <span className="min-w-0 truncate">{item.label}</span>
        <span aria-hidden="true" className="text-meta tracking-normal opacity-60">✕</span>
      </Link>)}
      <Link href="/app/contributions" prefetch={false} className="text-control font-bold text-warning-ink">Limpiar todo</Link>
    </div>}
  </div>;

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
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
        {cursor && <Link href={baseHref({ state: "archived" })} prefetch={false} className="text-control font-bold">Volver al contenido archivado más reciente</Link>}
        {morePath && <Link href={morePath} prefetch={false} className="font-bold">Ver más contenido archivado</Link>}
      </div>
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
    <p className="mt-4 text-control text-ink-muted">{resultCount(contents.length)}</p>

    {contents.length === 0
      ? <EmptyState
          className="mt-8"
          title={filtered ? "Sin resultados para estos filtros" : "Todavía no hay contenido administrable"}
          description={filtered
            ? "Ajusta la búsqueda, el tipo o el estado para encontrar el contenido."
            : "Crea un borrador para comenzar: elige el tipo de contenido y guarda la primera versión."}
          action={filtered
            ? <ButtonLink href="/app/contributions" variant="secondary">Limpiar filtros</ButtonLink>
            : <ButtonLink href="/app/contributions/new">Crear contenido</ButtonLink>}
        />
      : <div className="mt-8 space-y-10">
          {contributionFamilies.map((family) => {
            const familyTypes = family.types.filter((item) => (byType.get(item) ?? []).length > 0);
            if (familyTypes.length === 0) return null;
            const total = familyTypes.reduce((sum, item) => sum + (byType.get(item) ?? []).length, 0);
            return <section key={family.id} aria-labelledby={`family-${family.id}`}>
              <SectionHeader title={family.label} id={`family-${family.id}`} meta={resultCount(total)} className="mb-4" />
              <div className="space-y-6">
                {familyTypes.map((item) => {
                  const rows = byType.get(item) ?? [];
                  const shown = type ? rows : rows.slice(0, PREVIEW);
                  return <section key={item} aria-labelledby={`type-${item}`}>
                    <h3 id={`type-${item}`} className="flex flex-wrap items-baseline gap-2 text-control font-extrabold uppercase tracking-[0.1em] text-ink-soft">
                      {contributionTypePlural(item)} <span className="font-bold tracking-normal text-label">({rows.length})</span>
                    </h3>
                    <div className="mt-3 grid gap-2.5">
                      {shown.map((row) => <Card
                        key={`${row.type}-${row.contentId}`}
                        as="article"
                        accent={stateTone[row.state]}
                        className="flex flex-wrap items-start justify-between gap-x-5 gap-y-4 p-5"
                      >
                        <div className="min-w-0 flex-[1_1_18rem]">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <StatusBadge state={row.state} />
                            <p className="text-control text-ink-muted">
                              {row.currentPublishedRevisionNumber && `Versión ${row.currentPublishedRevisionNumber} publicada`}
                              {row.currentPublishedRevisionNumber && row.draftRevisionNumber ? " · " : ""}
                              {row.draftRevisionNumber && `Versión ${row.draftRevisionNumber} en borrador`}
                            </p>
                          </div>
                          <h4 className="mt-2 text-card font-bold">{row.title}</h4>
                          <p className="mt-1 text-meta tracking-normal text-label">
                            Última actividad: {formatGovernanceTimestamp(row.activityAt)}
                          </p>
                        </div>
                        {/* Editing the Draft is the action this workspace exists for; reading
                            the published version accompanies it rather than competing with it. */}
                        <div className="flex flex-wrap items-center gap-2">
                          {row.currentPublishedRevisionId && <ButtonLink href={`/app/contributions/${row.type}/${row.currentPublishedRevisionId}`} size="xs" variant="secondary">Ver versión publicada</ButtonLink>}
                          {row.draftRevisionId && <ButtonLink href={`/app/contributions/${row.type}/${row.draftRevisionId}`} size="xs">Editar borrador</ButtonLink>}
                        </div>
                      </Card>)}
                    </div>
                    {shown.length < rows.length && <p className="mt-3">
                      <Link href={baseHref({ type: item })} prefetch={false} className="text-control font-bold">
                        Ver {contributionTypePlural(item).toLowerCase()} ({rows.length})
                      </Link>
                    </p>}
                  </section>;
                })}
              </div>
            </section>;
          })}
        </div>}

    {archivedPreview && archivedPreview.entries.length > 0 && <section aria-labelledby="archived-preview-title" className="mt-12 border-t border-hairline pt-8">
      <SectionHeader title="Contenido archivado" id="archived-preview-title" />
      <div className="grid gap-3">
        {archivedPreview.entries.map((entry) => <ArchivedEntry key={`${entry.type}-${entry.contentId}`} entry={entry} />)}
      </div>
      <p className="mt-3">
        <Link href={baseHref({ state: "archived" })} prefetch={false} className="text-control font-bold">Ver todo el contenido archivado</Link>
      </p>
    </section>}
  </Page>;
}
