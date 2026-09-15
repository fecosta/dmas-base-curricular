import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { contributionTypes } from "@/lib/contributions/types";

export default async function NewContributionPage() {
  await requireAccess("Admin");
  return <main id="contenido" className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
    <p className="eyebrow">Gestión editorial</p><h1 className="mt-2 text-4xl text-[#173f3a] sm:text-5xl">Crear contenido</h1>
    <p className="mt-3 max-w-2xl text-slate-700">Selecciona el tipo de conocimiento que deseas crear.</p>
    <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{contributionTypes.map((item) => <Link key={item.type} href={`/app/contributions/new/${item.type}`} prefetch={false} className="library-card no-underline transition hover:-translate-y-1">
      <h2 className="text-xl text-[#173f3a]">{item.label}</h2><p className="mt-3 text-slate-600">{item.description}</p>
    </Link>)}</div>
  </main>;
}
