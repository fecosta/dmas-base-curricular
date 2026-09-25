"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "./cn";

/**
 * The reference's primary search control: a pill input with a leading glyph and
 * a "/" shortcut hint, reachable from anywhere on the page.
 *
 * It stays an uncontrolled `<input name>` by default so it drops into the
 * Library's existing GET form without disturbing the contract that the URL — not
 * component state — holds applied filters.
 *
 * Phase 1 delivers the input and its keyboard affordance only. Suggestions and
 * the query endpoint behind them belong to Phase 3; nothing here reaches for
 * server data, which keeps the server-only curriculum query modules out of this
 * Client Component.
 */
export function SearchInput({
  label,
  shortcut = true,
  className,
  id,
  ...props
}: {
  /** Accessible name. Rendered for assistive technology; the placeholder carries it visually. */
  label: string;
  /** Focus the input when "/" is pressed outside a text field. */
  shortcut?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className">) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // A "/" typed into a field is a character, not a command.
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.isContentEditable) return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      }
      // While a modal dialog holds focus, pulling focus to an input behind it
      // would break the containment the overlay is there to provide.
      if (document.querySelector("dialog[open]")) return;
      const input = inputRef.current;
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcut]);

  return <div className={cn("relative flex items-center", className)}>
    <label htmlFor={inputId} className="sr-only">{label}</label>
    <span aria-hidden="true" className="pointer-events-none absolute left-3.5 text-sm text-label">⌕</span>
    <input
      {...props}
      ref={inputRef}
      id={inputId}
      type="search"
      aria-keyshortcuts={shortcut ? "/" : undefined}
      className={cn(
        // Matches the global control rule: 16px below the explorer breakpoint so
        // iOS Safari does not zoom the viewport on focus.
        "mt-0 rounded-full border-hairline py-2.5 pl-9 text-base explorer:text-control",
        // The hint only earns its space from the explorer breakpoint up; below it
        // the field keeps that width. The shortcut and its ARIA work at every width.
        shortcut ? "pr-4 explorer:pr-9" : "pr-4",
      )}
    />
    {shortcut && <span
      aria-hidden="true"
      className="pointer-events-none absolute right-3 hidden rounded-sm bg-hairline px-1.5 py-0.5 text-meta font-bold tracking-normal text-label explorer:block"
    >/</span>}
  </div>;
}
