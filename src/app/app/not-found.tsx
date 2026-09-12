import Link from "next/link";

export default function NotFound() {
  return <main id="contenido" className="mx-auto max-w-3xl px-5 py-20 text-center">
    <p className="eyebrow">Contenido no disponible</p><h1 className="mt-3 text-4xl text-[#173f3a]">No encontramos esta publicación.</h1>
    <p className="mt-4 text-slate-700">Puede que no exista, no esté publicada o haya sido archivada.</p>
    <Link href="/app/library" prefetch={false} className="mt-7 inline-block font-bold text-[#173f3a]">Volver a la biblioteca</Link>
  </main>;
}
