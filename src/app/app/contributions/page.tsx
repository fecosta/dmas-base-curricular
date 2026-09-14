import Link from "next/link";
import { listOwnContributions } from "@/lib/contributions/queries";
import { contributionTypeLabel } from "@/lib/contributions/types";

export default async function ContributionsPage() {
  const contributions = await listOwnContributions();
  return <main id="contenido" className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
    <header className="flex flex-wrap items-end justify-between gap-6 border-b border-slate-900/20 pb-8">
      <div><p className="eyebrow">Aportes a la red</p><h1 className="mt-2 text-4xl text-[#173f3a] sm:text-6xl">Mis contribuciones</h1><p className="mt-3 text-slate-700">Tus borradores y contenidos enviados para revisión.</p></div>
      <Link href="/app/contributions/new" prefetch={false} className="rounded-md bg-[#173f3a] px-5 py-3 font-bold text-white no-underline">Nueva contribución</Link>
    </header>
    {contributions.length === 0 ? <div className="empty-state mt-10">Todavía no tienes contribuciones. Crea un borrador para comenzar.</div> : <div className="mt-10 grid gap-4">{contributions.map((item) => <article key={item.revisionId} className="library-card flex flex-wrap items-center justify-between gap-5">
      <div><p className="eyebrow">{contributionTypeLabel(item.type)}</p><h2 className="mt-2 text-xl text-[#173f3a]">{item.title}</h2><p className="mt-2 text-sm text-slate-600">{item.status === "Draft" ? "Borrador" : "Enviado para revisión"}</p></div>
      <Link href={`/app/contributions/${item.type}/${item.revisionId}`} prefetch={false} className="font-bold text-[#173f3a]">{item.status === "Draft" ? "Editar borrador" : "Ver contribución"}</Link>
    </article>)}</div>}
  </main>;
}
