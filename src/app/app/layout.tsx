import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { getAnalyticsPreference } from "@/lib/privacy/analytics-preference";
import { privacyDocuments } from "@/lib/privacy/contract";
import { AppHeader } from "@/components/app-header";
import { type NavItem } from "@/components/primary-nav";
import { Container } from "@/components/ui/page";

export const dynamic = "force-dynamic";

export default async function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const access = await requireAccess();
  const roleLabel = access.role === "Admin" ? "Administrador" : "Miembro";

  // The persisted row is the only source of this decision. An unreadable
  // preference is not a decision and must not enable analytics, so it resolves
  // to "rejected" for the shell: analytics stays OFF, and the user is not
  // prompted on the strength of a failed read.
  const preference = await getAnalyticsPreference();
  const analyticsDecision = preference.status === "resolved" ? preference.preference.decision : "rejected";

  // Filtered here, not in the client component: an Admin-only destination must
  // never be serialised into a reader's markup. AppHeader renders exactly what
  // this array holds, at every width.
  const navigation: NavItem[] = [{ label: "Biblioteca", href: "/app/library" }];
  if (access.role === "Admin") navigation.push(
    { label: "Administrar contenido", href: "/app/contributions" },
    { label: "Organizaciones", href: "/app/organizations" },
    { label: "Usuarios", href: "/app/users" },
  );

  return <div className="flex min-h-screen flex-col bg-canvas">
    {/*
      One band, as in the reference. The previous dark utility strip stacked a
      second bar above the toolbar, which read as a conventional administrative
      header; the organisation and role it carried now sit in the header's
      account control, and in the navigation sheet at compact widths.
    */}
    <AppHeader
      items={navigation}
      organizationName={access.organizationName}
      roleLabel={roleLabel}
      analyticsDecision={analyticsDecision}
    />

    <div className="flex-1">{children}</div>

    <footer className="on-dark mt-16 bg-night text-white">
      <Container width="wide" className="py-12">
        <span className="text-xl font-black tracking-[-0.03em] text-accent">DEMOCRACIA+</span>
        <p className="mt-3 max-w-md text-body text-white/70">
          Biblioteca curricular compartida de la red Democracia+. Módulos, programas, docentes e
          instituciones de referencia en un solo lugar.
        </p>
      </Container>
      <div className="border-t border-white/10">
        <Container width="wide" className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4 text-meta tracking-normal text-white/55">
          <span>Democracia+ · Red de formación política</span>
          {/*
            The authoritative privacy documents, reachable from every
            authenticated surface rather than only from the privacy dialogs.
          */}
          <Link href={privacyDocuments.notice.href} prefetch={false}>{privacyDocuments.notice.title}</Link>
          <Link href={privacyDocuments.terms.href} prefetch={false}>{privacyDocuments.terms.title}</Link>
        </Container>
      </div>
    </footer>
  </div>;
}
