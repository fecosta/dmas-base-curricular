import { redirect } from "next/navigation";
import { getAccess } from "@/lib/auth/access";
import { signOut } from "@/app/login/actions";
import { AuthGate } from "@/components/auth-gate";
import { Button } from "@/components/ui/button";

export default async function AccessDeniedPage() {
  const access = await getAccess();
  if (access.status === "unauthenticated") redirect("/login");
  if (access.status === "unavailable") throw new Error("Access lookup unavailable");

  return <AuthGate title="Acceso no autorizado">
    <p className="text-ink-soft">
      Tu sesión está iniciada, pero no tienes autorización para acceder a esta sección. Contacta con la
      administración de Democracia+ para revisar tu cuenta y tu organización.
    </p>
    <form action={signOut} className="mt-6">
      <Button type="submit">Cerrar sesión</Button>
    </form>
  </AuthGate>;
}
