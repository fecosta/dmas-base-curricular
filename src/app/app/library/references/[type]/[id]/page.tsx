import Link from "next/link";
import { getReference } from "@/lib/curriculum/queries";

export default async function ReferencePage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const reference = await getReference(type, id);
  const externalUrl = reference.entityType === "material" ? reference.sourceUrl : reference.websiteUrl;
  return <main id="contenido" className="mx-auto max-w-5xl px-5 py-10 lg:px-8">
    <Link href="/app/library" prefetch={false} className="text-sm font-bold text-[#173f3a]">← Volver a referencias</Link>
    <article className="mt-8 grid gap-10 border-t-8 border-[#c84b31] bg-white/60 p-6 sm:p-10 lg:grid-cols-[1fr_16rem]">
      <div><p className="eyebrow">{reference.entityType === "material" ? "Material o estudio" : "Institución o centro de referencia"}</p><h1 className="mt-3 text-4xl leading-tight text-[#173f3a] sm:text-6xl">{reference.title}</h1>
        {reference.description ? <p className="mt-7 max-w-2xl text-lg text-slate-700">{reference.description}</p> : <p className="mt-7 text-slate-600">Esta referencia no tiene descripción publicada.</p>}
        {externalUrl && <a href={externalUrl} target="_blank" rel="noreferrer" className="mt-8 inline-block rounded-full bg-[#173f3a] px-5 py-3 font-bold text-white no-underline">Abrir sitio externo</a>}
      </div>
      <dl className="space-y-5 border-l border-slate-900/15 pl-6"><div><dt className="eyebrow">Tipo</dt><dd className="mt-1 font-bold">{reference.classification}</dd></div>
        {reference.countryOrScope && <div><dt className="eyebrow">País o alcance</dt><dd className="mt-1">{reference.countryOrScope}</dd></div>}
        {reference.sourceOrInstitution && <div><dt className="eyebrow">Fuente o institución</dt><dd className="mt-1">{reference.sourceOrInstitution}</dd></div>}
        {reference.themes.length > 0 && <div><dt className="eyebrow">Temas</dt><dd className="mt-2 flex flex-wrap gap-2">{reference.themes.map((theme) => <span key={theme} className="rounded-full bg-[#e7c76e]/45 px-3 py-1 text-sm">{theme}</span>)}</dd></div>}
      </dl>
    </article>
  </main>;
}
