import Link from "next/link";
import { ModuleDetailDialog } from "@/app/app/library/module-dialog";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * A module the canonical route would refuse, refused in the overlay too.
 *
 * `getModule` calls notFound() for an id that is not a module this reader may
 * currently see — unpublished, archived, or not a module at all — and the
 * contextual presentation must say so rather than open an empty panel. It is
 * the same message the standalone route's not-found state carries, because it
 * is the same decision, taken by the same query.
 */
export default function ContextualModuleNotFound() {
  return <ModuleDetailDialog eyebrow="Biblioteca" title="No encontramos este módulo.">
    <EmptyState
      title="No encontramos esta publicación."
      description="Puede que no exista, no esté publicada o haya sido archivada."
      action={<Link href="/app/library" prefetch={false} className="font-bold">Volver a la biblioteca</Link>}
    />
  </ModuleDetailDialog>;
}
