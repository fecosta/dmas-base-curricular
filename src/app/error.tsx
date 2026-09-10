"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main id="contenido" className="mx-auto max-w-lg space-y-6 px-6 py-16">
    <h1>No pudimos completar la solicitud</h1>
    <p>Inténtalo de nuevo. Si el problema continúa, contacta con la administración.</p>
    <button onClick={reset}>Reintentar</button>
  </main>;
}
