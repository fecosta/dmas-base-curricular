import { getPrivacyDocument } from "@/lib/privacy/documents";
import { PrivacyDocumentBody } from "@/app/app/privacidad/document-body";
import { Page } from "@/components/ui/page";

export const metadata = { title: "Términos de Uso — D+ Base Curricular" };

/**
 * The user-facing Terms of Use, rendered from `docs/TERMS_OF_USE.md`.
 *
 * Reading the Terms is not an analytics decision. This route neither reads nor
 * writes the analytics preference, which is what keeps the two decisions
 * separate in the implementation and not only in the copy.
 */
export default async function TermsOfUsePage() {
  return <Page width="narrow">
    <PrivacyDocumentBody blocks={await getPrivacyDocument("terms")} />
  </Page>;
}
