"use client";

import { useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { SuggestionPopover, suggestionItems, useSuggestions } from "@/components/search-suggestions";
import { libraryParams } from "@/lib/curriculum/library-href";
import { minSuggestionQuery } from "@/lib/curriculum/suggestions";
import { isLibrarySearchPath } from "@/lib/ui/nav";
import { cn } from "@/components/ui/cn";

/**
 * The primary Library search, in the shell header where the reference puts it.
 *
 * It is a plain GET form onto the existing canonical route: submitting produces
 * `/app/library?q=…`, the same URL the Library filter form has always produced.
 * No new endpoint on the submit path, no server action, no client-held applied
 * state, and no contact with the server-only curriculum query modules.
 *
 * Every other applied filter is carried through as a hidden field, read from the
 * live URL. Without that, searching from the header would silently clear the
 * country, theme, axis, entity and view the reader had already applied.
 */
export function ShellSearch({ className }: { className?: string }) {
  const pathname = usePathname();
  const params = useSearchParams();

  // Rendered only where a Library search is unambiguous; see isLibrarySearchPath.
  if (!isLibrarySearchPath(pathname)) return null;

  // Remounts when the applied query changes so the field and its suggestions
  // start again from what the URL actually holds after a filter navigation.
  return <LibrarySearchForm key={params.get("q") ?? ""} className={className} />;
}

function LibrarySearchForm({ className }: { className?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const listId = useId();

  const applied = params.get("q") ?? "";
  const carried = libraryParams
    .filter((param) => param !== "q")
    .map((param) => [param, params.get(param) ?? ""] as const)
    .filter(([, value]) => value !== "");

  // Transient interaction state only. The URL stays the applied-filter contract:
  // nothing here is durable, and none of it survives the navigation it causes.
  const [typed, setTyped] = useState(applied);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const { groups, ready } = useSuggestions(typed);
  const items = suggestionItems(groups);
  const expanded = open && typed.trim().length >= minSuggestionQuery;
  const optionId = (index: number) => `${listId}-o${index}`;

  // A fresh list invalidates the highlight, which was an index into the old one.
  // Adjusted during render rather than in an effect so no pass ever paints a
  // highlight pointing at a suggestion that is no longer there.
  const [highlighted, setHighlighted] = useState(groups);
  if (groups !== highlighted) {
    setHighlighted(groups);
    setActive(-1);
  }

  function close() {
    setOpen(false);
    setActive(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      // Only swallow Escape when it has something to dismiss, so it still
      // reaches an enclosing overlay otherwise.
      if (!expanded) return;
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (items.length === 0) return;
      event.preventDefault();
      setOpen(true);
      setActive((current) => {
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        return (next + items.length) % items.length;
      });
      return;
    }
    if (event.key === "Enter" && expanded && items[active]) {
      // With a suggestion highlighted, Enter opens it. With none highlighted the
      // form submits normally to /app/library?q=… — suggestions never replace
      // ordinary search.
      event.preventDefault();
      close();
      router.push(items[active].href);
    }
  }

  return <form
    method="get"
    action="/app/library"
    role="search"
    className={cn("relative min-w-0 flex-1", className)}
    onSubmit={close}
    // Focus leaving the field or the popover dismisses it — including when a
    // modal drawer takes focus, so the popover never lingers behind a scrim.
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) close(); }}
  >
    {carried.map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
    <SearchInput
      label="Buscar en la biblioteca"
      name="q"
      defaultValue={applied}
      placeholder="Buscar tema, docente o institución…"
      autoComplete="off"
      role="combobox"
      aria-expanded={expanded}
      aria-controls={listId}
      aria-autocomplete="list"
      aria-activedescendant={expanded && active >= 0 ? optionId(active) : undefined}
      onChange={(event) => { setTyped(event.target.value); setOpen(true); }}
      onFocus={() => setOpen(true)}
      onKeyDown={onKeyDown}
    />
    {expanded && <SuggestionPopover
      id={listId}
      groups={groups}
      ready={ready}
      query={typed.trim()}
      activeIndex={active}
      optionId={optionId}
      onSelect={close}
    />}
  </form>;
}
