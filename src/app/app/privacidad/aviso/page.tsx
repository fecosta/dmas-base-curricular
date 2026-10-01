import { getPrivacyDocument } from "@/lib/privacy/documents";
import { PrivacyDocumentBody } from "@/app/app/privacidad/document-body";
import { Page } from "@/components/ui/page";

export const metadata = { title: "Aviso de Privacidad — D+ Base Curricular" };

/**
 * The user-facing Privacy Notice, rendered from `docs/PRIVACY_NOTICE.md`.
 *
 * Opening it cannot change the analytics preference: this route performs no
 * mutation and reads no preference.
 */
export default async function PrivacyNoticePage() {
  return <Page width="narrow">
    <PrivacyDocumentBody blocks={await getPrivacyDocument("notice")} />
  </Page>;
}
