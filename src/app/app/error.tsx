"use client";

export default function ApplicationError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="contenido" className="mx-auto max-w-3xl px-5 py-20 text-center">
    <p className="eyebrow">Error de lectura</p><h1 className="mt-3 text-4xl text-[#173f3a]">No pudimos abrir la biblioteca.</h1>
    <p className="mt-4 text-slate-700">Inténtalo nuevamente. Si el problema continúa, contacta al equipo de Democracia+.</p>
    <button onClick={reset} className="mt-7">Intentar de nuevo</button>
  </main>;
}
