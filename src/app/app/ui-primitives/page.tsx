import { notFound } from "next/navigation";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { PrimitivesHarness } from "./harness";

/**
 * Development-only test harness for the SPEC-006 Phase 1 primitives.
 *
 * Dialog, Drawer and SearchInput carry behaviour — focus containment, Escape,
 * focus restoration, scroll lock, the "/" shortcut — that only a real browser
 * can verify, and Phase 1 deliberately does not yet wire them into any product
 * surface. This route gives tests/e2e/ui-primitives.spec.ts somewhere to drive
 * them from until Phase 3 and Phase 4 put them on the Library and module detail,
 * at which point it should be deleted.
 *
 * It renders nothing in production, and it inherits the authenticated boundary
 * of the /app segment either way. It reads no product data.
 */
export default function UiPrimitivesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <Page width="content">
    <PageHeader
      eyebrow="Interno"
      title="Primitivos de interfaz"
      lede="Banco de pruebas de desarrollo para los primitivos de SPEC-006. No forma parte del producto."
    />
    <div className="mt-8">
      <PrimitivesHarness />
    </div>
  </Page>;
}
