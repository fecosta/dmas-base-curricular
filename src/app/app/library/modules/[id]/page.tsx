import Link from "next/link";
import { getModule } from "@/lib/curriculum/queries";

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const curriculumModule = await getModule((await params).id);
  const topicName = new Map(curriculumModule.programTopics.map((topic) => [topic.id, topic.title]));
  return <main id="contenido" className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
    <Link href="/app/library" prefetch={false} className="text-sm font-bold text-[#173f3a]">← Volver a la biblioteca</Link>
    <header className="mt-8 border-b border-slate-900/20 pb-10">
      <p className="eyebrow">{curriculumModule.axis.name}</p><h1 className="mt-3 max-w-4xl text-4xl leading-tight text-[#173f3a] sm:text-6xl">{curriculumModule.title}</h1>
      {curriculumModule.theme && <p className="mt-5 inline-block rounded-full bg-[#e7c76e]/50 px-4 py-2 text-sm font-bold">Tema: {curriculumModule.theme}</p>}
      <p className="mt-7 max-w-3xl text-lg text-slate-700">{curriculumModule.description}</p>
    </header>

    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_0.55fr]">
      <div className="space-y-12">
        <section aria-labelledby="program-title"><p className="eyebrow">Contenido del módulo</p><h2 id="program-title" className="mt-2 text-3xl text-[#173f3a]">Programa</h2>
          {curriculumModule.programTopics.length ? <ol className="mt-6 space-y-4">{curriculumModule.programTopics.map((topic, index) => <li key={topic.id} className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-slate-900/15 pt-4"><span className="font-mono text-[#c84b31]">{String(index + 1).padStart(2, "0")}</span><div><h3 className="font-bold">{topic.title}</h3>{topic.description && <p className="mt-1 text-slate-700">{topic.description}</p>}</div></li>)}</ol> : <p className="empty-state mt-5">Este módulo aún no tiene temas de Programa publicados.</p>}
        </section>
        {curriculumModule.learningOutcomes.length > 0 && <section aria-labelledby="outcomes-title"><h2 id="outcomes-title">Resultados de aprendizaje</h2><ul className="mt-4 list-disc space-y-2 pl-6">{curriculumModule.learningOutcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}</ul></section>}
        <section aria-labelledby="notes-title"><h2 id="notes-title">Notas docentes</h2>{curriculumModule.teachingNotes.length ? <div className="mt-4 space-y-4">{curriculumModule.teachingNotes.map((note) => <article key={note.id} className="rounded-xl bg-white/65 p-5"><h3 className="font-bold">{note.title}</h3>{note.programTopicId && <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#c84b31]">Programa: {topicName.get(note.programTopicId)}</p>}{note.text && <p className="mt-3 text-slate-700">{note.text}</p>}{note.materials.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{note.materials.map((material) => <Link key={material.id} href={`/app/library/references/material/${material.id}`} prefetch={false} className="rounded-full bg-[#e7c76e]/40 px-3 py-1 text-sm font-bold text-[#173f3a] no-underline">{material.title}</Link>)}</div>}{note.sourceUrl && <a href={note.sourceUrl} rel="noreferrer" target="_blank" className="mt-3 inline-block font-bold">Abrir fuente externa</a>}</article>)}</div> : <p className="mt-3 text-slate-600">No hay notas docentes publicadas.</p>}</section>
      </div>

      <aside className="space-y-8">
        <section className="rounded-2xl bg-[#173f3a] p-6 text-white"><h2 className="text-[#e7c76e]">Docentes y especialistas</h2>{curriculumModule.instructors.length ? <div className="mt-4 space-y-5">{curriculumModule.instructors.map((instructor) => <article key={instructor.id}><h3 className="font-bold">{instructor.name}</h3><p className="text-sm text-white/75">{[instructor.roleOrTitle, instructor.institution, instructor.country].filter(Boolean).join(" · ")}</p>{instructor.profile && <p className="mt-2 text-sm text-white/85">{instructor.profile}</p>}{instructor.linkedinUrl && <a href={instructor.linkedinUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-white">Ver perfil</a>}</article>)}</div> : <p className="mt-3 text-white/70">Sin perfiles asociados.</p>}</section>
        <section><h2>Materiales y estudios</h2><div className="mt-4 space-y-3">{curriculumModule.materials.length ? curriculumModule.materials.map((material) => <Link key={material.id} href={`/app/library/references/material/${material.id}`} prefetch={false} className="block rounded-xl border border-slate-900/15 bg-white/55 p-4 no-underline"><span className="eyebrow">{material.materialType}</span><strong className="mt-1 block text-[#173f3a]">{material.title}</strong></Link>) : <p className="text-slate-600">Sin materiales asociados.</p>}</div></section>
        <section><h2>Instituciones</h2><div className="mt-4 space-y-3">{curriculumModule.institutions.length ? curriculumModule.institutions.map((institution) => <Link key={institution.id} href={`/app/library/references/institution/${institution.id}`} prefetch={false} className="block rounded-xl border border-slate-900/15 bg-white/55 p-4 no-underline"><span className="eyebrow">{institution.institutionType}</span><strong className="mt-1 block text-[#173f3a]">{institution.name}</strong></Link>) : <p className="text-slate-600">Sin instituciones asociadas.</p>}</div></section>
      </aside>
    </div>
  </main>;
}
