import { Page } from "@/components/ui/page";
import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return <Page width="wide"><LoadingState title="Preparando la biblioteca…" /></Page>;
}
