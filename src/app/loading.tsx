import { Page } from "@/components/ui/page";
import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return <Page width="content"><LoadingState title="Cargando…" /></Page>;
}
