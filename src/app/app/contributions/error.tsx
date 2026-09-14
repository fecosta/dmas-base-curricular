"use client";

export default function ContributionsError({ reset }: { error: Error; reset: () => void }) {
  return <main id="contenido" className="mx-auto max-w-3xl px-5 py-16">
    <p className="eyebrow">Contribuciones no disponibles</p>
    <h1 className="mt-2 text-4xl text-[#173f3a]">No pudimos abrir tus contribuciones.</h1>
    <p className="mt-4 text-slate-700">Inténtalo nuevamente. Si el problema continúa, vuelve más tarde.</p>
    <button type="button" onClick={reset} className="mt-8">Reintentar</button>
  </main>;
}
