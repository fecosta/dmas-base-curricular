import Link from "next/link";
import { getLibrary, getProgramOutlines, type SearchResult } from "@/lib/curriculum/queries";
import { libraryHref, paramValue, type LibraryQuery } from "@/lib/curriculum/library-href";
import { appliedFilters, clearFiltersHref, readEntity, readView } from "@/lib/curriculum/library-state";
import { axisToneResolver } from "@/lib/ui/axis-tone";
import { Page, Container } from "@/components/ui/page";
import { HeroBand } from "@/components/ui/page-header";
import { Card, toneDot } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { ButtonLink } from "@/components/ui/button";
import { SegmentedLinks } from "@/components/ui/segmented";
import { SectionHeader, resultCount } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ClearFiltersLink, LibraryFilterGroups, LibraryFilterPanel } from "@/components/library/filter-panel";
import { LibraryFilterDrawer } from "@/components/library/filter-drawer";
import { ActiveFilters } from "@/components/library/active-filters";
import { ModuleCard, ProgramRow, ReferenceCard } from "@/components/library/cards";

// References stay discoverable but must not bury the curriculum. In the
// unfiltered view each reference family shows a bounded preview with an explicit
// link to its complete filtered set, so nothing becomes unreachable.
const PREVIEW = 6;

/**
 * The reference's fluid card grid: cards hold their editorial width where there
 * is room and collapse to one column rather than overflowing when there is not.
 */
const GRID = "grid gap-4 grid-cols-[repeat(auto-fill,minmax(min(260px,100%),1fr))] explorer:grid-cols-[repeat(auto-fill,minmax(min(332px,100%),1fr))]";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<LibraryQuery> }) {
  const query = await searchParams;
  const view = readView(query);
  const entity = readEntity(query);
  const axis = paramValue(query, "axis");
  const library = await getLibrary({
    query: paramValue(query, "q"), entity,
    axis, country: paramValue(query, "country"), theme: paramValue(query, "theme"),
  });
  const modules = library.results.filter((item) => item.entity_type === "module");
  const materials = library.results.filter((item) => item.entity_type === "material");
  const institutions = library.results.filter((item) => item.entity_type === "institution");
  const toneFor = axisToneResolver(library.axes);
  const showingEverything = !entity;
  const filters = appliedFilters(query, library.axes);
  // The drawer holds the country and theme dimensions; the rest stay in the
  // results header at every width, as in the reference.
  const drawerFilters = filters.filter((filter) => filter.param === "country" || filter.param === "theme").length;

  // Curriculum structure is only loaded for the Programa view, and only for the
  // modules actually on screen.
  const outlines = view === "programa" && modules.length > 0
    ? new Map((await getProgramOutlines(modules.map((item) => item.id))).map((o) => [o.moduleId, o.topics]))
    : new Map();

  // Programa presents the curriculum under its axes, which is the strongest
  // structure the published data actually carries. It remains an alternative
  // view of the same library, not a sequence.
  const axisGroups = library.axes
    .map((option) => ({ option, rows: modules.filter((item) => item.classification === option.name) }))
    .filter((group) => group.rows.length > 0);

  const referenceSection = (
    title: string,
    id: string,
    items: SearchResult[],
    kind: "material" | "institution",
    label: string,
  ) => {
    const limited = showingEverything ? items.slice(0, PREVIEW) : items;
    return <section aria-labelledby={id} className="mt-10 border-t border-hairline pt-8">
      <SectionHeader title={title} id={id} meta={resultCount(items.length)} />
      {items.length === 0
        ? <EmptyState
            align="start"
            title={`Sin ${label} que coincidan`}
            description="Ningún registro publicado coincide con estos filtros."
          />
        : <>
            <div className={GRID}>
              {limited.map((item) => <ReferenceCard key={`${item.entity_type}-${item.id}`} item={item} kind={kind} />)}
            </div>
            {limited.length < items.length && <p className="mt-5">
              <Link href={libraryHref(query, { entity: kind })} prefetch={false} className="text-sm font-bold">
                Ver {label} ({items.length})
              </Link>
            </p>}
          </>}
    </section>;
  };

  return <Page width="bleed">
    <HeroBand
      eyebrow="Explorador curricular"
      title="Biblioteca"
      lede="Módulos y referencias publicados para toda la red. Filtre por eje, país y tema y consulte cualquier módulo sin orden previo."
    />

    {/*
      The Explorer composition: a narrow persistent filter column beside the
      results. Every control in both regions is a link to a Library URL — the
      address bar stays the applied-filter contract, which is what keeps the
      whole surface reload-safe, shareable and Back/Forward correct.
    */}
    <Container
      width="wide"
      className="py-8 explorer:grid explorer:grid-cols-[292px_minmax(0,1fr)] explorer:items-start explorer:gap-6 explorer:py-10"
    >
      <LibraryFilterPanel
        query={query}
        countries={library.countries}
        themes={library.themes}
        hasFilters={filters.length > 0}
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-hairline bg-surface px-4 py-3 shadow-panel">
          <SegmentedLinks
            label="Eje"
            options={[
              { label: "Todos", href: libraryHref(query, { axis: "" }), active: !axis },
              ...library.axes.map((option) => ({
                label: option.name,
                href: libraryHref(query, { axis: option.id }),
                active: axis === option.id,
              })),
            ]}
          />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <SegmentedLinks
              label="Tipo"
              options={[
                { label: "Todo", href: libraryHref(query, { entity: "" }), active: !entity },
                { label: "Módulos", href: libraryHref(query, { entity: "module" }), active: entity === "module" },
                { label: "Materiales", href: libraryHref(query, { entity: "material" }), active: entity === "material" },
                { label: "Instituciones", href: libraryHref(query, { entity: "institution" }), active: entity === "institution" },
              ]}
            />
            <SegmentedLinks
              label="Vista"
              options={[
                { label: "Grilla", href: libraryHref(query, { view: "grilla" }), active: view === "grilla" },
                { label: "Programa", href: libraryHref(query, { view: "programa" }), active: view === "programa" },
              ]}
            />
            <LibraryFilterDrawer
              activeCount={drawerFilters}
              footer={<ClearFiltersLink query={query}>Limpiar filtros</ClearFiltersLink>}
            >
              <LibraryFilterGroups query={query} countries={library.countries} themes={library.themes} />
            </LibraryFilterDrawer>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <ActiveFilters filters={filters} query={query} />
          <p className="ms-auto text-control text-ink-muted">{resultCount(library.results.length)}</p>
        </div>

        {library.results.length === 0
          ? <EmptyState
              className="mt-6"
              title="Ningún resultado con esta combinación"
              description="Quite un filtro de país, tema o eje para ampliar la búsqueda."
              action={<ButtonLink href={clearFiltersHref(query)} variant="secondary">Limpiar filtros</ButtonLink>}
            />
          : <>
              {entity !== "material" && entity !== "institution" && entity !== "reference" && <section aria-labelledby="modules-title" className="mt-8">
                <SectionHeader title="Módulos" id="modules-title" meta={resultCount(modules.length)} />
                {modules.length === 0
                  ? <EmptyState
                      title="No hay módulos que coincidan"
                      description="No hay módulos publicados que coincidan con estos filtros. Pruebe con otro eje, país o tema."
                      action={<ButtonLink href={clearFiltersHref(query)} variant="secondary">Limpiar filtros</ButtonLink>}
                    />
                  : view === "grilla"
                    ? <div className={GRID}>
                        {modules.map((item) => <ModuleCard key={item.id} item={item} tone={toneFor(item.classification)} />)}
                      </div>
                    : <div className="space-y-4">
                        {axisGroups.map(({ option, rows }) => <Card key={option.id} elevation="panel" className="overflow-hidden rounded-xl p-0">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4">
                            <h3 className="flex items-center gap-2.5 text-base">
                              <span aria-hidden="true" className={cn("size-2.5 shrink-0 rounded-full", toneDot[toneFor(option.name)])} />
                              {option.name}
                            </h3>
                            <span className="text-control text-label">{rows.length === 1 ? "1 módulo" : `${rows.length} módulos`}</span>
                          </div>
                          <ol>
                            {rows.map((item, index) => <ProgramRow
                              key={item.id}
                              item={item}
                              tone={toneFor(item.classification)}
                              position={index + 1}
                              topics={outlines.get(item.id) ?? []}
                            />)}
                          </ol>
                        </Card>)}
                      </div>}
              </section>}

              {entity !== "module" && entity !== "institution" && referenceSection("Materiales y estudios", "materials-title", materials, "material", "materiales")}
              {entity !== "module" && entity !== "material" && referenceSection("Instituciones", "institutions-title", institutions, "institution", "instituciones")}
            </>}
      </div>
    </Container>
  </Page>;
}
