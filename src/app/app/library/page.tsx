import Link from "next/link";
import { getLibrary, getProgramOutlines, type SearchResult } from "@/lib/curriculum/queries";
import { libraryHref, paramValue, type LibraryQuery } from "@/lib/curriculum/library-href";
import { axisToneResolver } from "@/lib/ui/axis-tone";
import { Page, Container } from "@/components/ui/page";
import { HeroBand } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Button, ButtonLink } from "@/components/ui/button";
import { SegmentedLinks } from "@/components/ui/segmented";
import { SectionHeader, resultCount } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";

// References stay discoverable but must not bury the curriculum. In the
// unfiltered view each reference family shows a bounded preview with an explicit
// link to its complete filtered set, so nothing becomes unreachable.
const PREVIEW = 6;

function detailHref(item: SearchResult) {
  return item.entity_type === "module"
    ? `/app/library/modules/${item.id}`
    : `/app/library/references/${item.entity_type}/${item.id}`;
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<LibraryQuery> }) {
  const query = await searchParams;
  const view = paramValue(query, "view") === "programa" ? "programa" : "grilla";
  const entity = paramValue(query, "entity");
  const axis = paramValue(query, "axis");
  const allowedEntity = ["module", "reference", "material", "institution"].includes(entity)
    ? entity as "module" | "reference" | "material" | "institution"
    : undefined;
  const library = await getLibrary({
    query: paramValue(query, "q"), entity: allowedEntity, axis,
    country: paramValue(query, "country"), theme: paramValue(query, "theme"),
  });
  const modules = library.results.filter((item) => item.entity_type === "module");
  const materials = library.results.filter((item) => item.entity_type === "material");
  const institutions = library.results.filter((item) => item.entity_type === "institution");
  const toneFor = axisToneResolver(library.axes);
  const showingEverything = !allowedEntity;

  // Curriculum structure is only loaded for the Programa view, and only for the
  // modules actually on screen.
  const outlines = view === "programa" && modules.length > 0
    ? new Map((await getProgramOutlines(modules.map((item) => item.id))).map((o) => [o.moduleId, o.topics]))
    : new Map();

  const referenceSection = (
    title: string,
    id: string,
    items: SearchResult[],
    kind: "material" | "institution",
    label: string,
  ) => {
    const limited = showingEverything ? items.slice(0, PREVIEW) : items;
    return <section aria-labelledby={id} className="mt-12 border-t border-hairline pt-8">
      <SectionHeader title={title} id={id} meta={resultCount(items.length)} />
      {items.length === 0
        ? <EmptyState
            align="start"
            title={`Sin ${label} que coincidan`}
            description="Ningún registro publicado coincide con estos filtros."
          />
        : <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {limited.map((item) => <Card key={`${item.entity_type}-${item.id}`} as="article" accent={kind === "material" ? "warning" : "accent"} className="flex flex-col p-5">
                <p className="eyebrow">{item.classification}</p>
                <h3 className="mt-2 text-base leading-snug">{item.title}</h3>
                {item.country_or_scope && <p className="mt-2 text-sm text-ink-muted">{item.country_or_scope}</p>}
                {item.description && <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{item.description}</p>}
                <div className="mt-4">
                  <ButtonLink href={detailHref(item)} size="sm" variant="secondary">Explorar referencia</ButtonLink>
                </div>
              </Card>)}
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

    <Container width="wide" className="grid gap-8 py-10 lg:grid-cols-[18rem_1fr] lg:py-14">
      {/* Filters stay a plain GET form: the URL is the filter contract. */}
      <form method="get" className="lg:sticky lg:top-20 lg:self-start">
        {/* Search itself now lives in the shell header, where the reference puts
            it. `q` is still carried here so applying a country or theme keeps the
            reader's search instead of clearing it. */}
        <input type="hidden" name="q" value={paramValue(query, "q")} />
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="axis" value={axis} />
        <input type="hidden" name="entity" value={entity} />
        <details open className="group rounded-lg border border-hairline bg-surface shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-bold text-ink">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-4 rounded-[5px] bg-accent" />
              Filtros
            </span>
            <span aria-hidden="true" className="text-xs text-label transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="grid gap-4 border-t border-hairline px-5 pb-5 pt-4">
            <Field label="País o alcance">
              <select name="country" defaultValue={paramValue(query, "country")}>
                <option value="">Todos</option>
                {library.countries.map((country) => <option key={country}>{country}</option>)}
              </select>
            </Field>
            <Field label="Tema">
              <select name="theme" defaultValue={paramValue(query, "theme")}>
                <option value="">Todos</option>
                {library.themes.map((theme) => <option key={theme}>{theme}</option>)}
              </select>
            </Field>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit">Aplicar filtros</Button>
              <Link href="/app/library" prefetch={false} className="text-sm font-bold">Limpiar</Link>
            </div>
          </div>
        </details>
      </form>

      <div className="min-w-0">
        <div className="grid gap-4 rounded-lg border border-hairline bg-surface px-5 py-4 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
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
            <SegmentedLinks
              label="Vista"
              options={[
                { label: "Grilla", href: libraryHref(query, { view: "grilla" }), active: view === "grilla" },
                { label: "Programa", href: libraryHref(query, { view: "programa" }), active: view === "programa" },
              ]}
            />
          </div>
          <SegmentedLinks
            label="Tipo"
            className="border-t border-hairline pt-4"
            options={[
              { label: "Todo", href: libraryHref(query, { entity: "" }), active: !entity },
              { label: "Módulos", href: libraryHref(query, { entity: "module" }), active: entity === "module" },
              { label: "Materiales", href: libraryHref(query, { entity: "material" }), active: entity === "material" },
              { label: "Instituciones", href: libraryHref(query, { entity: "institution" }), active: entity === "institution" },
            ]}
          />
        </div>

        {entity !== "material" && entity !== "institution" && entity !== "reference" && <section aria-labelledby="modules-title" className="mt-10">
          <SectionHeader title="Módulos" id="modules-title" meta={resultCount(modules.length)} />
          {modules.length === 0
            ? <EmptyState
                title="No hay módulos que coincidan"
                description="No hay módulos publicados que coincidan con estos filtros. Pruebe con otro eje, país o tema."
                action={<ButtonLink href="/app/library" variant="secondary">Limpiar filtros</ButtonLink>}
              />
            : view === "grilla"
              ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {modules.map((item) => <Card key={item.id} as="article" accent={toneFor(item.classification)} className="flex flex-col p-6">
                    <p className="eyebrow">{item.classification}</p>
                    <h3 className="mt-3 text-xl leading-snug">{item.title}</h3>
                    {item.theme && <p className="mt-2 text-sm font-bold text-accent-ink">{item.theme}</p>}
                    <p className="mt-4 line-clamp-3 text-ink-soft">{item.description}</p>
                    <div className="mt-6 border-t border-hairline pt-5">
                      <ButtonLink href={detailHref(item)} size="sm">Abrir módulo</ButtonLink>
                    </div>
                  </Card>)}
                </div>
              /* Programa mode exposes each module's curriculum structure so the
                 reader can understand the content without opening every module.
                 It is an alternative view of the same library, not a sequence. */
              : <div className="space-y-5">
                  {modules.map((item) => {
                    const topics = outlines.get(item.id) ?? [];
                    return <Card key={item.id} as="article" accent={toneFor(item.classification)} className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="eyebrow">{item.classification}</p>
                          <h3 className="mt-2 text-xl leading-snug">{item.title}</h3>
                          {item.theme && <p className="mt-2 text-sm font-bold text-accent-ink">{item.theme}</p>}
                        </div>
                        <ButtonLink href={detailHref(item)} size="sm" className="shrink-0">Ver programa</ButtonLink>
                      </div>
                      {topics.length > 0
                        ? <ol className="mt-5 grid gap-x-8 gap-y-2 border-t border-hairline pt-4 sm:grid-cols-2">
                            {topics.map((topic: { id: string; title: string }, index: number) => <li key={topic.id} className="flex gap-3 text-sm text-ink-soft">
                              <span aria-hidden="true" className="font-mono text-xs text-label">{String(index + 1).padStart(2, "0")}</span>
                              <span className="min-w-0">{topic.title}</span>
                            </li>)}
                          </ol>
                        : <p className="mt-5 border-t border-hairline pt-4 text-sm text-ink-muted">Este módulo aún no tiene temas de Programa publicados.</p>}
                    </Card>;
                  })}
                </div>}
        </section>}

        {entity !== "module" && entity !== "institution" && referenceSection("Materiales y estudios", "materials-title", materials, "material", "materiales")}
        {entity !== "module" && entity !== "material" && referenceSection("Instituciones", "institutions-title", institutions, "institution", "instituciones")}
      </div>
    </Container>
  </Page>;
}
