import Link from "next/link";

export default function ContributionNotFound() {
  return <main id="contenido" className="mx-auto max-w-3xl px-5 py-16">
    <p className="eyebrow">Contribución no disponible</p>
    <h1 className="mt-2 text-4xl text-[#173f3a]">No encontramos esta contribución.</h1>
    <p className="mt-4 text-slate-700">Puede que no exista o que no tengas permiso para verla.</p>
    <Link href="/app/contributions" prefetch={false} className="mt-8 inline-block font-bold text-[#173f3a]">Volver a mis contribuciones</Link>
  </main>;
}
