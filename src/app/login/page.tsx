import { LoginForm } from "./login-form";

type LoginPageProps = { searchParams: Promise<{ error?: string | string[] }> };

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const error = (await searchParams).error;
  return <main id="contenido" className="mx-auto max-w-lg px-6 py-16">
    <p className="mb-6 font-semibold text-teal-800">Democracia+</p>
    <h1>Ingresar a Base Curricular</h1>
    <p className="mt-4">Biblioteca privada para organizaciones de la red Democracia+.</p>
    <p className="mt-2">Usa tu correo institucional. Tu organización y tu cuenta deben estar habilitadas por la administración.</p>
    {error === "oauth" && <p role="alert" className="mt-6">No pudimos iniciar sesión con Google. Inténtalo de nuevo o usa un código por correo.</p>}
    <LoginForm />
  </main>;
}
