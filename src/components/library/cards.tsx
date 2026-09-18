import { ButtonLink } from "@/components/ui/button";
import { Card, toneDot, type Tone } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";
import { entityHref } from "@/lib/curriculum/library-state";
import type { SearchResult } from "@/lib/curriculum/queries";

/**
 * Curriculum result cards, in the reference's denser editorial language.
 *
 * Each card carries exactly one link. Stretching it over the card gives the
 * whole surface as a target without nesting a second link inside the first, and
 * an aria-label naming the record keeps a page of cards from reaching assistive
 * technology as a row of identical "Abrir módulo"s. The visible label opens the
 * accessible name, so speech control still works on what is written.
 *
 * The destination is `entityHref` — the canonical route, unchanged by contextual
 * detail. Opening a module from here is intercepted into an overlay by the
 * router, not by a different link, so the card carries no knowledge of how its
 * destination will be presented.
 */
const shell = "group relative flex flex-col p-5 transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-hairline-strong hover:shadow-panel";

/** Axis/classification identity: the coloured marker plus the compact kicker the reference leads with. */
function Kicker({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <p className="flex items-center gap-2.5">
    <span aria-hidden="true" className={cn("size-[7px] shrink-0 rounded-full", toneDot[tone])} />
    <span className="eyebrow min-w-0 truncate">{children}</span>
  </p>;
}

export function ModuleCard({ item, tone }: { item: SearchResult; tone: Tone }) {
  return <Card as="article" accent={tone} className={cn(shell, "gap-2")}>
    <Kicker tone={tone}>{item.classification}</Kicker>
    <h3 className="text-card">{item.title}</h3>
    {item.theme && <p className="text-control font-bold text-accent-ink">{item.theme}</p>}
    <p className="mt-1 line-clamp-3 text-control leading-relaxed text-ink-soft">{item.description}</p>
    <div className="mt-auto flex items-center justify-end border-t border-hairline pt-3.5">
      <ButtonLink
        href={entityHref("module", item.id)}
        size="xs"
        aria-label={`Abrir módulo: ${item.title}`}
        className="after:absolute after:inset-0"
      >Abrir módulo</ButtonLink>
    </div>
  </Card>;
}

/**
 * Materials and institutions keep their own semantics rather than collapsing
 * into one generic reference: the type and the country/scope a reader filters by
 * are what distinguishes them, and both stay on the card.
 */
export function ReferenceCard({ item, kind }: { item: SearchResult; kind: "material" | "institution" }) {
  const tone: Tone = kind === "material" ? "warning" : "accent";
  return <Card as="article" accent={tone} className={cn(shell, "gap-2")}>
    <Kicker tone={tone}>{item.classification}</Kicker>
    <h3 className="text-base leading-snug">{item.title}</h3>
    {item.description && <p className="mt-1 line-clamp-2 text-control leading-relaxed text-ink-soft">{item.description}</p>}
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-3.5">
      <span className="min-w-0 truncate text-meta tracking-normal text-label">{item.country_or_scope ?? item.theme ?? ""}</span>
      <ButtonLink
        href={entityHref(kind, item.id)}
        size="xs"
        variant="secondary"
        aria-label={`Explorar referencia: ${item.title}`}
        className="after:absolute after:inset-0"
      >Explorar referencia</ButtonLink>
    </div>
  </Card>;
}

/**
 * A module as a Programa row: the reference's numbered list line, with the
 * module's published Programa topics underneath so curriculum structure is
 * readable without opening every module.
 */
export function ProgramRow({ item, tone, position, topics }: {
  item: SearchResult;
  tone: Tone;
  position: number;
  topics: readonly { id: string; title: string }[];
}) {
  return <li className="border-t border-hairline first:border-t-0">
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
      <span aria-hidden="true" className="w-6 shrink-0 font-mono text-meta font-bold tracking-normal text-hairline-strong">
        {String(position).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        {/* h4: the Programa list nests module titles under their axis heading. */}
        <h4 className="text-base font-bold leading-snug tracking-[-0.01em]">{item.title}</h4>
        {item.theme && <p className="mt-1 text-meta tracking-normal text-label">{item.theme}</p>}
      </div>
      <ButtonLink
        href={entityHref("module", item.id)}
        size="xs"
        aria-label={`Ver programa: ${item.title}`}
        className="shrink-0"
      >Ver programa</ButtonLink>
    </div>
    {topics.length > 0
      ? <ol className="grid gap-x-8 gap-y-1.5 px-5 pb-4 pl-15 sm:grid-cols-2">
          {topics.map((topic, index) => <li key={topic.id} className="flex gap-2.5 text-control text-ink-soft">
            <span aria-hidden="true" className={cn("mt-1.5 size-[5px] shrink-0 rounded-full", toneDot[tone])} />
            <span className="min-w-0">{index + 1}. {topic.title}</span>
          </li>)}
        </ol>
      : <p className="px-5 pb-4 pl-15 text-control text-ink-muted">Este módulo aún no tiene temas de Programa publicados.</p>}
  </li>;
}
