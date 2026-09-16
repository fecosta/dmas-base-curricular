import { LoginForm } from "./login-form";
import { AuthGate } from "@/components/auth-gate";
import { Notice } from "@/components/ui/notice";

type LoginPageProps = { searchParams: Promise<{ error?: string | string[] }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const error = (await searchParams).error;

  return <AuthGate
    title="Base Curricular"
    lede="Biblioteca privada para organizaciones de la red Democracia+. Usa tu correo institucional: tu organización y tu cuenta deben estar habilitadas por la administración."
  >
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-sm font-black text-white">D+</span>
      <h2 className="text-lg">Acceso a la base</h2>
    </div>
    {error === "oauth" && <Notice tone="error" className="mt-5">
      No pudimos iniciar sesión con Google. Inténtalo de nuevo o usa un código por correo.
    </Notice>}
    <LoginForm />
  </AuthGate>;
}
