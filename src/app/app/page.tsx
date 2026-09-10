import { requireAccess } from "@/lib/auth/access";
import { signOut } from "@/app/login/actions";

export default async function ApplicationPage() {
  const access = await requireAccess();
  return <>
    <header className="border-b border-stone-200 bg-white px-6 py-5">
      <nav aria-label="Navegación principal" className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
        <a href="/app" className="font-bold text-teal-800 no-underline">D+ Base Curricular</a>
        <form action={signOut}><button type="submit">Cerrar sesión</button></form>
      </nav>
    </header>
    <main id="contenido" className="mx-auto max-w-5xl space-y-6 px-6 py-12">
      <h1>Bienvenido a Base Curricular</h1>
      <p>Tu acceso a la biblioteca de la red Democracia+ está habilitado.</p>
      <section aria-labelledby="account-title" className="max-w-xl rounded-lg border border-stone-200 bg-white p-6">
        <h2 id="account-title">Tu cuenta</h2>
        <dl className="mt-4 space-y-3">
          <div><dt className="font-semibold">Correo institucional</dt><dd>{access.email}</dd></div>
          <div><dt className="font-semibold">Organización</dt><dd>{access.organizationName}</dd></div>
          <div><dt className="font-semibold">Rol</dt><dd>{access.role === "Admin" ? "Administrador" : "Colaborador"}</dd></div>
        </dl>
      </section>
    </main>
  </>;
}
