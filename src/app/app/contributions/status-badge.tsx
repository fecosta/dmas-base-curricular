import type { ManagementState } from "@/lib/contributions/types";

const status = {
  draft: { label: "Borrador", className: "bg-amber-100 text-amber-900" },
  published: { label: "Publicado", className: "bg-emerald-100 text-emerald-900" },
  published_with_draft: { label: "Nueva versión en borrador", className: "bg-blue-100 text-blue-900" },
} satisfies Record<ManagementState, { label: string; className: string }>;

export function StatusBadge({ state }: { state: ManagementState }) {
  const current = status[state];
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${current.className}`}>{current.label}</span>;
}
