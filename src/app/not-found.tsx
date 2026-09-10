import Link from "next/link";

export default function NotFound() {
  return <main id="contenido" className="mx-auto max-w-lg space-y-6 px-6 py-16">
    <h1>Página no encontrada</h1>
    <Link href="/app">Volver al inicio</Link>
  </main>;
}
