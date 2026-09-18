"use client";

import { useId, useMemo, useState } from "react";
import type { ContributionOption } from "@/lib/contributions/types";
import { cn } from "@/components/ui/cn";
import { SearchInput } from "@/components/ui/search-input";

const stateSuffix: Record<ContributionOption["state"], string> = {
  draft: " (borrador)",
  published_with_draft: " (nueva versión en borrador)",
  published: "",
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/**
 * What the picker shows for a given set of options, selection and search term.
 *
 * Extracted from the component because it is the picker's actual contract:
 * searching hides non-matching *unselected* options only, so a filtered search
 * can never hide an existing selection, and the selected list is always the
 * full selection rather than the part that happens to match.
 */
export function relationshipOptionView(
  options: readonly ContributionOption[],
  chosen: readonly string[],
  term: string,
) {
  const chosenSet = new Set(chosen);
  const needle = normalize(term.trim());
  const selected = options.filter((option) => chosenSet.has(option.id));
  const visible = options.filter((option) => chosenSet.has(option.id) || !needle || normalize(option.label).includes(needle));
  return { chosenSet, selected, visible, hiddenBySearch: options.length - visible.length };
}

/**
 * Searchable relationship selector.
 *
 * Every option is rendered exactly once as a real checkbox sharing `name`, so the
 * submitted FormData is identical to the native <select multiple> it replaces
 * (`contributionPayload` reads these with `form.getAll(name)`). No new endpoint,
 * no client data store, and the surrounding disabled fieldset still makes a
 * published revision read-only.
 *
 * Options keep a stable position: searching hides non-matching *unselected*
 * options only, and selecting one never moves or unmounts its checkbox. That
 * keeps keyboard focus where the user left it and means a filtered search can
 * never hide an existing selection.
 *
 * Phase 5 refines the presentation — a counted legend, the Explorer's search
 * pill, chips that name what they remove — without touching any of the above.
 */
export function RelationshipPicker({ name, legend, searchLabel, options, selected = [], hint }: {
  name: string;
  legend: string;
  searchLabel: string;
  options: ContributionOption[];
  selected?: string[];
  hint?: string;
}) {
  const known = useMemo(() => new Set(options.map((option) => option.id)), [options]);
  const [chosen, setChosen] = useState<string[]>(() => selected.filter((id) => known.has(id)));
  const [term, setTerm] = useState("");
  const listId = useId();

  const { chosenSet, selected: selectedOptions, visible, hiddenBySearch } = relationshipOptionView(options, chosen, term);

  const toggle = (id: string) => setChosen((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  return <fieldset className="min-w-0 rounded-xl border border-hairline bg-inset p-4 explorer:p-5">
    <legend className="flex items-center gap-2 px-1">
      <span className="filter-label">{legend}</span>
      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-meta font-extrabold tracking-normal text-primary">
        {selectedOptions.length}
      </span>
    </legend>
    {hint && <p className="text-xs text-ink-muted">{hint}</p>}

    {/* With nothing to relate to, the selection summary and the search would both
        be empty controls explaining the same absence. One sentence says it once. */}
    {options.length === 0 ? <p className="mt-3 text-control text-ink-muted">Todavía no hay opciones disponibles para vincular.</p> : <>
      <div className="mt-3">
        {selectedOptions.length === 0
          ? <p className="text-control text-ink-muted">Ninguna seleccionada todavía.</p>
          : <ul className="flex flex-wrap gap-2">
              {selectedOptions.map((option) => <li key={option.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => toggle(option.id)}
                  aria-label={`Quitar ${option.label}`}
                  className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 py-1 pl-3 pr-2 text-control font-bold text-primary transition-colors hover:bg-primary/20 disabled:hover:bg-primary/10"
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center rounded-full bg-primary/20 text-meta leading-none tracking-normal">✕</span>
                </button>
              </li>)}
            </ul>}
      </div>

      <div className="mt-4 border-t border-hairline pt-4">
        {/*
          The Library's "/" shortcut deliberately stays off here: a module form
          carries three of these pickers, and a global key that pulled focus into
          one of them would fight the field the Admin is actually typing in.
        */}
        <SearchInput
          label={searchLabel}
          shortcut={false}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          aria-controls={listId}
          placeholder={`${searchLabel}…`}
        />
        <ul id={listId} className="mt-3 max-h-64 space-y-1 overflow-y-auto" aria-label={`Opciones de ${legend}`}>
          {visible.map((option) => <li key={option.id}>
            <label className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-control hover:bg-surface",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
              chosenSet.has(option.id) && "bg-primary/8 font-bold text-primary",
            )}>
              <input
                type="checkbox"
                name={name}
                value={option.id}
                checked={chosenSet.has(option.id)}
                onChange={() => toggle(option.id)}
                className="m-0 mt-0.5 size-4 shrink-0 rounded border-hairline-strong p-0 accent-primary"
              />
              <span className="min-w-0 break-words">{option.label}<span className="font-normal text-ink-muted">{stateSuffix[option.state]}</span></span>
            </label>
          </li>)}
        </ul>
        {visible.length === 0 && <p className="mt-2 text-control text-ink-muted">Sin coincidencias para esa búsqueda.</p>}
        {hiddenBySearch > 0 && visible.length > 0 && <p className="mt-2 text-xs text-ink-muted" aria-live="polite">
          {hiddenBySearch} opciones ocultas por la búsqueda.
        </p>}
      </div>
    </>}
  </fieldset>;
}
