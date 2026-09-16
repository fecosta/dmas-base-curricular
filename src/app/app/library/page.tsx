import Link from "next/link";
import { getLibrary, type SearchResult } from "@/lib/curriculum/queries";
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
  const references = library.results.filter((item) => item.entity_type !== "module");
  const toneFor = axisToneResolver(library.axes);

  return <Page width="bleed">
    <HeroBand
      eyebrow="Explorador curricular"
      title="Biblioteca"
      lede="Módulos y referencias publicados para toda la red. Filtre por eje, país y tema y consulte cualquier módulo sin orden previo."
    />

    <Container width="wide" className="grid gap-8 py-10 lg:grid-cols-[18rem_1fr] lg:py-14">
      {/* Filters stay a plain GET form: the URL is the filter contract. */}
      <form method="get" className="lg:sticky lg:top-6 lg:self-start">
        <input type="hidden" name="view" value={view} />
        <input type="hidden" name="axis" value={axis} />
        {/* Open by default; collapsible so the filter panel does not push results
            below the fold on small screens. One DOM node, no mobile duplicate. */}
        <details open className="group rounded-lg border border-hairline bg-surface shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 font-bold text-ink">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="size-4 rounded-[5px] bg-accent" />
              Filtros
            </span>
            <span aria-hidden="true" className="text-xs text-label transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="grid gap-4 border-t border-hairline px-5 pb-5 pt-4">
            <Field label="Buscar">
              <input name="q" defaultValue={paramValue(query, "q")} placeholder="Módulos, materiales, instituciones…" />
            </Field>
            <Field label="Tipo">
              <select name="entity" defaultValue={entity}>
                <option value="">Todo</option>
                <option value="module">Módulos</option>
                <option value="reference">Referencias</option>
                <option value="material">Materiales y estudios</option>
                <option value="institution">Instituciones</option>
              </select>
            </Field>
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
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-lg border border-hairline bg-surface px-5 py-4 shadow-card">
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

        <section aria-labelledby="modules-title" className="mt-10">
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
              : <Card className="divide-y divide-hairline">
                  {modules.map((item, index) => <article key={item.id} className="grid gap-4 p-5 sm:grid-cols-[3rem_1fr_auto] sm:items-center">
                    <span className="font-mono text-sm text-label">{String(index + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="eyebrow">{item.classification}</p>
                      <h3 className="mt-1 text-lg">{item.title}</h3>
                      <p className="mt-2 max-w-3xl text-ink-soft">{item.description}</p>
                    </div>
                    <ButtonLink href={detailHref(item)} size="sm" className="justify-self-start sm:justify-self-end">Ver programa</ButtonLink>
                  </article>)}
                </Card>}
        </section>

        <section aria-labelledby="references-title" className="mt-14 border-t border-hairline pt-10">
          <SectionHeader
            title="Referencias"
            id="references-title"
            meta={resultCount(references.length)}
          />
          {references.length === 0
            ? <EmptyState
                title="No hay referencias que coincidan"
                description="No hay referencias publicadas que coincidan con estos filtros. Las referencias no se filtran por eje."
              />
            : <div className="grid gap-4 md:grid-cols-2">
                {references.map((item) => <Card key={`${item.entity_type}-${item.id}`} as="article" accent={item.entity_type === "material" ? "warning" : "accent"} className="flex flex-col p-5">
                  <p className="eyebrow">{item.entity_type === "material" ? "Material o estudio" : "Institución"} · {item.classification}</p>
                  <h3 className="mt-2 text-lg">{item.title}</h3>
                  {item.country_or_scope && <p className="mt-2 text-sm text-ink-muted">{item.country_or_scope}</p>}
                  <p className="mt-3 text-ink-soft">{item.description}</p>
                  <div className="mt-5">
                    <ButtonLink href={detailHref(item)} size="sm" variant="secondary">Explorar referencia</ButtonLink>
                  </div>
                </Card>)}
              </div>}
        </section>
      </div>
    </Container>
  </Page>;
}
