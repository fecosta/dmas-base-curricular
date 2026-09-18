import { getModule } from "@/lib/curriculum/queries";
import { ModuleDetailBody } from "@/app/app/library/module-detail";
import { ModuleDetailDialog } from "@/app/app/library/module-dialog";

/**
 * The canonical module route, presented contextually.
 *
 * Reached only by navigating to /app/library/modules/[id] from inside the
 * Library section; the URL, the segment and the module are the canonical ones,
 * and this file changes nothing but how they are presented. A direct visit or a
 * reload never reaches here — Next.js only intercepts a client-side navigation —
 * so the standalone page remains the complete experience it always was.
 *
 * Authority is unchanged and unweakened: the same `getModule` call the canonical
 * page makes, against the same published-reader boundary, with the same
 * not-found behaviour for a module this reader may not see. There is no
 * contextual query, no contextual data shape and no contextual visibility.
 */
export default async function ContextualModulePage({ params }: { params: Promise<{ id: string }> }) {
  const curriculumModule = await getModule((await params).id);

  return <ModuleDetailDialog
    eyebrow={curriculumModule.axis.name}
    title={curriculumModule.title}
    lede={curriculumModule.description}
  >
    <ModuleDetailBody module={curriculumModule} />
  </ModuleDetailDialog>;
}
