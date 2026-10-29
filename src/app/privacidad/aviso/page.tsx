import { getPrivacyDocument } from "@/lib/privacy/documents";
import { PrivacyDocumentBody } from "@/app/app/privacidad/document-body";
import { Page } from "@/components/ui/page";

export const metadata = { title: "Aviso de Privacidad — D+ Base Curricular" };

/**
 * The public Privacy Notice, rendered from `docs/PRIVACY_NOTICE.md`.
 *
 * Lives outside `/app` on purpose: it is the only privacy document reachable
 * without signing in, so the external feedback form can link to it. Neither the
 * app layout's eligibility check nor the session proxy applies here, so this
 * page must stay free of auth, session, Supabase, preference and analytics
 * code and must show no personal or curriculum data. The Terms of Use remain
 * authenticated. tests/privacy-public-notice.test.ts enforces this boundary.
 */
export default async function PublicPrivacyNoticePage() {
  return <Page width="narrow">
    <PrivacyDocumentBody blocks={await getPrivacyDocument("notice")} />
  </Page>;
}
