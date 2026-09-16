import type { ManagementState } from "@/lib/contributions/types";
import { Badge, type BadgeTone } from "@/components/ui/badge";

const status = {
  draft: { label: "Borrador", tone: "warning" },
  published: { label: "Publicado", tone: "success" },
  published_with_draft: { label: "Nueva versión en borrador", tone: "info" },
} satisfies Record<ManagementState, { label: string; tone: BadgeTone }>;

export function StatusBadge({ state }: { state: ManagementState }) {
  const current = status[state];
  return <Badge tone={current.tone}>{current.label}</Badge>;
}
