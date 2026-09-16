import type { ManagementViewState } from "@/lib/contributions/types";
import { Badge, type BadgeTone } from "@/components/ui/badge";

// `archived` is identity state, not a revision status; it shares this badge only
// because both answer "what can I do with this content right now?".
const status = {
  draft: { label: "Borrador", tone: "warning" },
  published: { label: "Publicado", tone: "success" },
  published_with_draft: { label: "Nueva versión en borrador", tone: "info" },
  archived: { label: "Archivado", tone: "neutral" },
} satisfies Record<ManagementViewState, { label: string; tone: BadgeTone }>;

export function StatusBadge({ state }: { state: ManagementViewState }) {
  const current = status[state];
  return <Badge tone={current.tone}>{current.label}</Badge>;
}
