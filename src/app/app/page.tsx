import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";

export default async function ApplicationPage() {
  const access = await requireAccess();
  return <main id="contenido" className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-20">
    <div className="grid items-end gap-10 border-b border-slate-900/20 pb-14 lg:grid-cols-[1.4fr_0.6fr]">
      <section>
        <p className="eyebrow">Conocimiento compartido</p>
        <h1 className="mt-4 max-w-3xl text-5xl leading-[0.95] text-[#173f3a] sm:text-7xl">Una biblioteca para fortalecer la democracia.</h1>
        <p className="mt-7 max-w-2xl text-lg text-slate-700">Explora módulos curriculares y referencias publicadas por la red Democracia+.</p>
        <Link href="/app/library" prefetch={false} className="mt-8 inline-block rounded-full bg-[#c84b31] px-6 py-3 font-bold text-white no-underline hover:bg-[#a93d28]">Explorar la biblioteca</Link>
      </section>
      <section aria-labelledby="account-title" className="rounded-2xl border border-slate-900/15 bg-white/60 p-6">
        <h2 id="account-title">Tu cuenta</h2>
        <dl className="mt-4 space-y-3">
          <div><dt className="font-semibold">Correo institucional</dt><dd>{access.email}</dd></div>
          <div><dt className="font-semibold">Organización</dt><dd>{access.organizationName}</dd></div>
          <div><dt className="font-semibold">Rol</dt><dd>{access.role === "Admin" ? "Administrador" : "Colaborador"}</dd></div>
        </dl>
      </section>
    </div>
    <div className="mt-12 grid gap-6 sm:grid-cols-2">
      <div className="border-l-4 border-[#e7c76e] pl-5"><p className="text-3xl font-black text-[#173f3a]">2</p><p>Ejes curriculares iniciales</p></div>
      <div className="border-l-4 border-[#c84b31] pl-5"><p className="text-3xl font-black text-[#173f3a]">Una red</p><p>Contenido publicado disponible para miembros elegibles.</p></div>
    </div>
  </main>;
}
