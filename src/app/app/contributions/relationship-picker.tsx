"use client";

import { useId, useMemo, useState } from "react";
import type { ContributionOption } from "@/lib/contributions/types";
import { cn } from "@/components/ui/cn";

const stateSuffix: Record<ContributionOption["state"], string> = {
  draft: " (borrador)",
  published_with_draft: " (nueva versión en borrador)",
  published: "",
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
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

  const chosenSet = new Set(chosen);
  const selectedOptions = options.filter((option) => chosenSet.has(option.id));
  const needle = normalize(term.trim());
  const visible = options.filter((option) => chosenSet.has(option.id) || !needle || normalize(option.label).includes(needle));
  const hiddenBySearch = options.length - visible.length;

  const toggle = (id: string) => setChosen((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

  return <fieldset className="rounded-lg border border-hairline bg-surface p-5 md:col-span-2">
    <legend className="filter-label px-1">{legend}</legend>
    {hint && <p className="text-xs text-ink-muted">{hint}</p>}

    <div className="mt-3">
      <p className="text-sm font-bold text-ink">
        Seleccionadas <span className="font-normal text-ink-muted">({selectedOptions.length})</span>
      </p>
      {selectedOptions.length === 0
        ? <p className="mt-2 text-sm text-ink-muted">Ninguna seleccionada todavía.</p>
        : <ul className="mt-2 flex flex-wrap gap-2">
            {selectedOptions.map((option) => <li key={option.id}>
              <button
                type="button"
                onClick={() => toggle(option.id)}
                className="inline-flex items-center gap-2 rounded-full bg-primary/10 py-1 pl-3 pr-2 text-sm font-bold text-primary hover:bg-primary/20"
              >
                <span>{option.label}</span>
                <span aria-hidden="true" className="grid size-4 place-items-center rounded-full bg-primary/20 text-xs leading-none">×</span>
                <span className="sr-only">Quitar</span>
              </button>
            </li>)}
          </ul>}
    </div>

    <div className="mt-5 border-t border-hairline pt-4">
      <label className="block">
        <span className="filter-label">{searchLabel}</span>
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          aria-controls={listId}
          placeholder="Escribe para filtrar…"
        />
      </label>
      <ul id={listId} className="mt-3 max-h-64 space-y-1 overflow-y-auto" aria-label={`Opciones de ${legend}`}>
        {visible.map((option) => <li key={option.id}>
          <label className={cn(
            "flex cursor-pointer items-start gap-3 rounded-md px-3 py-2 text-sm hover:bg-inset",
            "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
            chosenSet.has(option.id) && "bg-primary/8 font-bold text-primary",
          )}>
            <input
              type="checkbox"
              name={name}
              value={option.id}
              checked={chosenSet.has(option.id)}
              onChange={() => toggle(option.id)}
              className="m-0 size-4 shrink-0 rounded border-hairline-strong p-0 accent-primary"
            />
            <span className="min-w-0">{option.label}<span className="font-normal text-ink-muted">{stateSuffix[option.state]}</span></span>
          </label>
        </li>)}
      </ul>
      {visible.length === 0 && <p className="mt-2 text-sm text-ink-muted">Sin coincidencias para esa búsqueda.</p>}
      {hiddenBySearch > 0 && visible.length > 0 && <p className="mt-2 text-xs text-ink-muted" aria-live="polite">
        {hiddenBySearch} opciones ocultas por la búsqueda.
      </p>}
    </div>
  </fieldset>;
}
