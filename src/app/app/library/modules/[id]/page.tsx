import Link from "next/link";
import { getModule } from "@/lib/curriculum/queries";
import { ModuleDetailBody } from "@/app/app/library/module-detail";
import { Page, Container } from "@/components/ui/page";

/**
 * The canonical module route.
 *
 * It stays the authoritative destination for a module at every entry point —
 * a direct visit, a shared or copied link, a reload, a new tab — and renders the
 * complete standalone experience without depending on any prior navigation. The
 * Library additionally intercepts this same URL to present it contextually; see
 * ../../@modal. Both presentations render ModuleDetailBody from this same
 * getModule read, so neither can diverge from the other.
 */
export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const curriculumModule = await getModule((await params).id);

  return <Page width="bleed">
    <div className="on-dark relative isolate overflow-hidden bg-night text-white">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(70%_120%_at_12%_0%,#151a6b_0%,transparent_60%),radial-gradient(60%_120%_at_85%_20%,#2a1350_0%,transparent_55%)]" />
      <Container width="content" className="py-10 lg:py-14">
        <Link href="/app/library" prefetch={false} className="text-sm font-bold">← Volver a la biblioteca</Link>
        <p className="eyebrow mt-8 text-accent">{curriculumModule.axis.name}</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl">{curriculumModule.title}</h1>
        <p className="mt-6 max-w-3xl text-lg text-white/75">{curriculumModule.description}</p>
      </Container>
    </div>

    <Container width="content" className="py-10 lg:py-14">
      <ModuleDetailBody module={curriculumModule} />
    </Container>
  </Page>;
}
