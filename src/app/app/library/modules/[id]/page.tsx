import Link from "next/link";
import { getModule, type TeachingNote } from "@/lib/curriculum/queries";
import { PublishedAttachments } from "@/app/app/library/published-attachments";
import { Page, Container } from "@/components/ui/page";
import { Card, DarkCard } from "@/components/ui/card";
import { MetaItem } from "@/components/ui/field";
import { SectionLabel } from "@/components/ui/section-header";
import { EmptyState, EmptyNote } from "@/components/ui/empty-state";

/**
 * A Teaching Note stays its own governed object; this only renders it in the
 * context of the Program Topic it already references.
 */
function TeachingNoteBody({ note }: { note: TeachingNote }) {
  return <>
    {note.text && <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{note.text}</p>}
    {note.materials.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
      {note.materials.map((material) => <Link
        key={material.id}
        href={`/app/library/references/material/${material.id}`}
        prefetch={false}
        className="rounded-full bg-surface px-3 py-1 text-xs font-bold no-underline hover:bg-primary/10 hover:no-underline"
      >{material.title}</Link>)}
    </div>}
    {note.sourceUrl && <a href={note.sourceUrl} rel="noreferrer" target="_blank" className="mt-3 inline-block text-sm font-bold">Abrir fuente externa</a>}
    <PublishedAttachments attachments={note.attachments} />
  </>;
}

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const curriculumModule = await getModule((await params).id);
  const notesByTopic = new Map<string, TeachingNote[]>();
  const generalNotes: TeachingNote[] = [];
  for (const note of curriculumModule.teachingNotes) {
    if (note.programTopicId) {
      if (!notesByTopic.has(note.programTopicId)) notesByTopic.set(note.programTopicId, []);
      notesByTopic.get(note.programTopicId)!.push(note);
    } else {
      generalNotes.push(note);
    }
  }

  return <Page width="bleed">
    <div className="on-dark relative isolate overflow-hidden bg-night text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_120%_at_12%_0%,#151a6b_0%,transparent_60%),radial-gradient(60%_120%_at_85%_20%,#2a1350_0%,transparent_55%)]" />
      <Container width="content" className="py-10 lg:py-14">
        <Link href="/app/library" prefetch={false} className="text-sm font-bold">← Volver a la biblioteca</Link>
        <p className="eyebrow mt-8 text-accent">{curriculumModule.axis.name}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl">{curriculumModule.title}</h1>
        <p className="mt-6 max-w-3xl text-lg text-white/75">{curriculumModule.description}</p>
      </Container>
    </div>

    <Container width="content" className="py-10 lg:py-14">
      {(curriculumModule.theme || curriculumModule.suggestedDuration) && <dl className="grid gap-4 sm:grid-cols-2">
        {curriculumModule.theme && <MetaItem label="Área temática">{curriculumModule.theme}</MetaItem>}
        {curriculumModule.suggestedDuration && <MetaItem label="Carga sugerida">{curriculumModule.suggestedDuration}</MetaItem>}
      </dl>}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-12">
          <section aria-labelledby="program-title">
            <SectionLabel id="program-title" tone="primary">Programa</SectionLabel>
            {curriculumModule.programTopics.length
              ? <ol className="mt-5 space-y-4">
                  {curriculumModule.programTopics.map((topic, index) => {
                    const notes = notesByTopic.get(topic.id) ?? [];
                    return <Card key={topic.id} as="li" className="p-5">
                      <div className="flex gap-4">
                        <span aria-hidden="true" className="mt-1 font-mono text-xs font-bold text-primary">{String(index + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg leading-snug">{topic.title}</h3>
                          {topic.description && <p className="mt-2 text-ink-soft">{topic.description}</p>}
                          {notes.map((note) => <div key={note.id} className="mt-4 rounded-md border-l-[3px] border-accent bg-inset p-4">
                            <p className="eyebrow">Nota docente</p>
                            {/* Authors often title a note after the topic it covers; repeating
                                it here would read as duplicated content. */}
                            {note.title !== topic.title && <h4 className="mt-1 font-bold">{note.title}</h4>}
                            <TeachingNoteBody note={note} />
                          </div>)}
                        </div>
                      </div>
                    </Card>;
                  })}
                </ol>
              : <EmptyState className="mt-5" align="start" title="Sin temas de Programa" description="Este módulo aún no tiene temas de Programa publicados." />}
          </section>

          {curriculumModule.learningOutcomes.length > 0 && <section aria-labelledby="outcomes-title">
            <SectionLabel id="outcomes-title" tone="success">Resultados de aprendizaje</SectionLabel>
            {/* Full-sentence outcomes read as a list, not as badges. */}
            <ul className="mt-5 space-y-3">
              {curriculumModule.learningOutcomes.map((outcome) => <li key={outcome} className="flex gap-3 text-ink-soft">
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-success" />
                <span>{outcome}</span>
              </li>)}
            </ul>
          </section>}

          {generalNotes.length > 0 && <section aria-labelledby="general-notes-title">
            <SectionLabel id="general-notes-title" tone="accent">Notas docentes generales</SectionLabel>
            <p className="mt-2 text-sm text-ink-muted">Notas del módulo que no corresponden a un tema específico del Programa.</p>
            <div className="mt-5 space-y-4">
              {generalNotes.map((note) => <Card key={note.id} as="article" className="p-5">
                <h3>{note.title}</h3>
                <TeachingNoteBody note={note} />
              </Card>)}
            </div>
          </section>}
        </div>

        <aside className="space-y-6">
          <DarkCard>
            <h2 className="text-accent">Docentes y especialistas</h2>
            {curriculumModule.instructors.length
              ? <div className="mt-5 space-y-5">
                  {curriculumModule.instructors.map((instructor) => <article key={instructor.id}>
                    <h3>{instructor.name}</h3>
                    <p className="mt-1 text-sm text-white/65">{[instructor.roleOrTitle, instructor.institution, instructor.country].filter(Boolean).join(" · ")}</p>
                    {instructor.profile && <p className="mt-2 text-sm text-white/80">{instructor.profile}</p>}
                    {instructor.linkedinUrl && <a href={instructor.linkedinUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-bold">Ver perfil</a>}
                  </article>)}
                </div>
              : <p className="mt-3 text-sm text-white/60">Sin perfiles asociados.</p>}
          </DarkCard>

          <section aria-labelledby="materials-title">
            <SectionLabel id="materials-title" tone="warning" level="h2">Materiales y estudios</SectionLabel>
            <div className="mt-4 space-y-3">
              {curriculumModule.materials.length
                ? curriculumModule.materials.map((material) => <Link
                    key={material.id}
                    href={`/app/library/references/material/${material.id}`}
                    prefetch={false}
                    className="block rounded-md border border-hairline bg-surface p-4 no-underline shadow-card hover:border-hairline-strong hover:no-underline"
                  >
                    <span className="eyebrow">{material.materialType}</span>
                    <strong className="mt-1 block text-ink">{material.title}</strong>
                  </Link>)
                : <EmptyNote>Sin materiales asociados.</EmptyNote>}
            </div>
          </section>

          <section aria-labelledby="institutions-title">
            <SectionLabel id="institutions-title" tone="accent" level="h2">Instituciones</SectionLabel>
            <div className="mt-4 space-y-3">
              {curriculumModule.institutions.length
                ? curriculumModule.institutions.map((institution) => <Link
                    key={institution.id}
                    href={`/app/library/references/institution/${institution.id}`}
                    prefetch={false}
                    className="block rounded-md border border-hairline bg-surface p-4 no-underline shadow-card hover:border-hairline-strong hover:no-underline"
                  >
                    <span className="eyebrow">{institution.institutionType}</span>
                    <strong className="mt-1 block text-ink">{institution.name}</strong>
                  </Link>)
                : <EmptyNote>Sin instituciones asociadas.</EmptyNote>}
            </div>
          </section>
        </aside>
      </div>
    </Container>
  </Page>;
}
