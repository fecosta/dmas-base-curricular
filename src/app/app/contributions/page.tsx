import Link from "next/link";
import { listManagedContent } from "@/lib/contributions/queries";
import { contributionTypeLabel } from "@/lib/contributions/types";
import { StatusBadge } from "./status-badge";

export default async function ContributionsPage() {
  const contents = await listManagedContent();
  return <main id="contenido" className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-slate-900/20 pb-8">
      <div><p className="eyebrow">Gestión editorial</p><h1 className="mt-2 text-4xl text-[#173f3a] sm:text-6xl">Administrar contenido</h1><p className="mt-3 max-w-2xl text-slate-700">Crea, edita y publica el conocimiento curricular de la red.</p></div>
      <Link href="/app/contributions/new" prefetch={false} className="rounded-md bg-[#173f3a] px-5 py-3 font-bold text-white no-underline">Crear contenido</Link>
    </header>
    {contents.length === 0 ? <div className="empty-state mt-10">Todavía no hay contenido administrable. Crea un borrador para comenzar.</div> : <div className="mt-10 grid gap-4">{contents.map((item) => <article key={`${item.type}-${item.contentId}`} className="library-card flex flex-wrap items-center justify-between gap-5">
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-3"><p className="eyebrow">{contributionTypeLabel(item.type)}</p><StatusBadge state={item.state} /></div><h2 className="mt-2 text-xl text-[#173f3a]">{item.title}</h2><p className="mt-2 text-sm text-slate-600">{item.currentPublishedRevisionNumber && `Versión ${item.currentPublishedRevisionNumber} publicada`}{item.currentPublishedRevisionNumber && item.draftRevisionNumber ? " · " : ""}{item.draftRevisionNumber && `Versión ${item.draftRevisionNumber} en borrador`}</p></div>
      <div className="flex flex-wrap gap-4">
        {item.currentPublishedRevisionId && <Link href={`/app/contributions/${item.type}/${item.currentPublishedRevisionId}`} prefetch={false} className="font-bold text-[#173f3a]">Ver versión publicada</Link>}
        {item.draftRevisionId && <Link href={`/app/contributions/${item.type}/${item.draftRevisionId}`} prefetch={false} className="font-bold text-[#173f3a]">Editar borrador</Link>}
      </div>
    </article>)}</div>}
  </main>;
}
