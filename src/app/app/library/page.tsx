import Link from "next/link";
import { getLibrary, type SearchResult } from "@/lib/curriculum/queries";

type Query = { [key: string]: string | string[] | undefined };

function value(query: Query, key: string) {
  const current = query[key];
  return typeof current === "string" ? current : "";
}

function viewHref(query: Query, view: "grilla" | "programa") {
  const params = new URLSearchParams();
  for (const key of ["q", "entity", "axis", "country", "theme"]) {
    const current = value(query, key);
    if (current) params.set(key, current);
  }
  params.set("view", view);
  return `/app/library?${params}`;
}

function detailHref(item: SearchResult) {
  return item.entity_type === "module"
    ? `/app/library/modules/${item.id}`
    : `/app/library/references/${item.entity_type}/${item.id}`;
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const view = value(query, "view") === "programa" ? "programa" : "grilla";
  const entity = value(query, "entity");
  const allowedEntity = ["module", "reference", "material", "institution"].includes(entity)
    ? entity as "module" | "reference" | "material" | "institution"
    : undefined;
  const library = await getLibrary({
    query: value(query, "q"), entity: allowedEntity, axis: value(query, "axis"),
    country: value(query, "country"), theme: value(query, "theme"),
  });
  const modules = library.results.filter((item) => item.entity_type === "module");
  const references = library.results.filter((item) => item.entity_type !== "module");

  return <main id="contenido" className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
    <header className="grid gap-6 border-b border-slate-900/20 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
      <div><p className="eyebrow">Explorador curricular</p><h1 className="mt-2 text-4xl text-[#173f3a] sm:text-6xl">Biblioteca</h1>
        <p className="mt-3 max-w-2xl text-slate-700">Módulos y referencias publicados para toda la red.</p></div>
      <div className="flex rounded-full border border-slate-900/20 bg-white/70 p-1" aria-label="Modo de presentación">
        <Link href={viewHref(query, "grilla")} prefetch={false} aria-current={view === "grilla" ? "page" : undefined} className={`rounded-full px-5 py-2 text-sm font-bold no-underline ${view === "grilla" ? "bg-[#173f3a] text-white" : "text-slate-700"}`}>Grilla</Link>
        <Link href={viewHref(query, "programa")} prefetch={false} aria-current={view === "programa" ? "page" : undefined} className={`rounded-full px-5 py-2 text-sm font-bold no-underline ${view === "programa" ? "bg-[#173f3a] text-white" : "text-slate-700"}`}>Programa</Link>
      </div>
    </header>

    <form method="get" className="my-8 grid gap-4 rounded-2xl bg-[#e7c76e]/35 p-5 md:grid-cols-2 lg:grid-cols-6">
      <input type="hidden" name="view" value={view} />
      <label className="md:col-span-2 lg:col-span-2"><span className="filter-label">Buscar</span><input name="q" defaultValue={value(query, "q")} placeholder="Módulos, materiales, instituciones…" /></label>
      <label><span className="filter-label">Tipo</span><select name="entity" defaultValue={entity}>
        <option value="">Todo</option><option value="module">Módulos</option><option value="reference">Referencias</option><option value="material">Materiales y estudios</option><option value="institution">Instituciones</option>
      </select></label>
      <label><span className="filter-label">Eje</span><select name="axis" defaultValue={value(query, "axis")}>
        <option value="">Todos</option>{library.axes.map((axis) => <option key={axis.id} value={axis.id}>{axis.name}</option>)}
      </select></label>
      <label><span className="filter-label">País o alcance</span><select name="country" defaultValue={value(query, "country")}>
        <option value="">Todos</option>{library.countries.map((country) => <option key={country}>{country}</option>)}
      </select></label>
      <label><span className="filter-label">Tema</span><select name="theme" defaultValue={value(query, "theme")}>
        <option value="">Todos</option>{library.themes.map((theme) => <option key={theme}>{theme}</option>)}
      </select></label>
      <div className="flex items-end gap-3 md:col-span-2 lg:col-span-6"><button type="submit">Aplicar filtros</button><Link href="/app/library" prefetch={false} className="px-3 py-3 text-sm font-bold text-[#173f3a]">Limpiar</Link></div>
    </form>

    <section aria-labelledby="modules-title" className="mt-12">
      <div className="mb-5 flex items-baseline justify-between gap-4"><h2 id="modules-title" className="text-2xl text-[#173f3a]">Módulos</h2><span className="text-sm text-slate-600">{modules.length} resultado{modules.length === 1 ? "" : "s"}</span></div>
      {modules.length === 0 ? <div className="empty-state">No hay módulos publicados que coincidan con estos filtros.</div>
        : view === "grilla" ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{modules.map((item) => <article key={item.id} className="library-card">
          <p className="eyebrow">{item.classification}</p><h3 className="mt-3 text-2xl font-bold text-[#173f3a]">{item.title}</h3>
          {item.theme && <p className="mt-3 text-sm font-bold text-[#c84b31]">{item.theme}</p>}<p className="mt-4 line-clamp-3 text-slate-700">{item.description}</p>
          <Link href={detailHref(item)} prefetch={false} className="mt-6 inline-block font-bold text-[#173f3a]">Abrir módulo</Link>
        </article>)}</div>
        : <div className="divide-y divide-slate-900/15 border-y border-slate-900/20">{modules.map((item, index) => <article key={item.id} className="grid gap-4 py-6 sm:grid-cols-[3rem_1fr_auto] sm:items-start">
          <span className="font-mono text-sm text-[#c84b31]">{String(index + 1).padStart(2, "0")}</span><div><p className="eyebrow">{item.classification}</p><h3 className="mt-1 text-xl font-bold">{item.title}</h3><p className="mt-2 max-w-3xl text-slate-700">{item.description}</p></div>
          <Link href={detailHref(item)} prefetch={false} className="font-bold text-[#173f3a]">Ver programa</Link>
        </article>)}</div>}
    </section>

    <section aria-labelledby="references-title" className="mt-16 border-t border-slate-900/20 pt-10">
      <div className="mb-5 flex items-baseline justify-between gap-4"><div><p className="eyebrow">Exploración complementaria</p><h2 id="references-title" className="mt-1 text-2xl text-[#173f3a]">Referencias</h2></div><span className="text-sm text-slate-600">{references.length} resultado{references.length === 1 ? "" : "s"}</span></div>
      {references.length === 0 ? <div className="empty-state">No hay referencias publicadas que coincidan con estos filtros.</div>
        : <div className="grid gap-4 md:grid-cols-2">{references.map((item) => <article key={`${item.entity_type}-${item.id}`} className="border-l-4 border-[#c84b31] bg-white/55 p-5">
          <p className="eyebrow">{item.entity_type === "material" ? "Material o estudio" : "Institución"} · {item.classification}</p>
          <h3 className="mt-2 text-xl font-bold">{item.title}</h3>{item.country_or_scope && <p className="mt-2 text-sm text-slate-600">{item.country_or_scope}</p>}
          <p className="mt-3 text-slate-700">{item.description}</p><Link href={detailHref(item)} prefetch={false} className="mt-4 inline-block font-bold text-[#173f3a]">Explorar referencia</Link>
        </article>)}</div>}
    </section>
  </main>;
}
