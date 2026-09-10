import { LoginForm } from "./login-form";

export default function LoginPage() {
  return <main id="contenido" className="mx-auto max-w-lg px-6 py-16">
    <p className="mb-6 font-semibold text-teal-800">Democracia+</p>
    <h1>Ingresar a Base Curricular</h1>
    <p className="mt-4">Biblioteca privada para organizaciones de la red Democracia+.</p>
    <p className="mt-2">Usa tu correo institucional. Tu organización y tu cuenta deben estar habilitadas por la administración.</p>
    <LoginForm />
  </main>;
}
