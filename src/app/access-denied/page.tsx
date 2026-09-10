import { redirect } from "next/navigation";
import { getAccess } from "@/lib/auth/access";
import { signOut } from "@/app/login/actions";

export default async function AccessDeniedPage() {
  const access = await getAccess();
  if (access.status === "unauthenticated") redirect("/login");
  if (access.status === "unavailable") throw new Error("Access lookup unavailable");
  return <main id="contenido" className="mx-auto max-w-lg space-y-6 px-6 py-16">
    <h1>Acceso no autorizado</h1>
    <p>Tu sesión está iniciada, pero no tienes autorización para acceder a esta sección. Contacta con la administración de Democracia+ para revisar tu cuenta y tu organización.</p>
    <form action={signOut}><button type="submit">Cerrar sesión</button></form>
  </main>;
}
