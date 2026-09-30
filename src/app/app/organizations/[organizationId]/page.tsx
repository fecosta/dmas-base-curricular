import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { listAdminOrganizationMembers, listAdminOrganizations } from "@/lib/admin-management";
import { AddOrganizationDomainForm, OrganizationNameForm, OrganizationStatusAction, RemoveOrganizationDomainAction } from "../management-forms";

export default async function OrganizationDetailPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const organizations = await listAdminOrganizations();
  const organization = organizations.find((item) => item.organizationId === organizationId);
  if (!organization) notFound();
  const members = await listAdminOrganizationMembers(organizationId);

  return <Page width="content">
    <PageHeader
      eyebrow="Administración · Organización"
      title={organization.name}
      lede="Administra el nombre, los dominios institucionales, el estado y las membresías de esta organización."
      actions={<ButtonLink href="/app/organizations" variant="secondary">Volver a organizaciones</ButtonLink>}
    />

    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
      <div className="space-y-8">
        <section aria-labelledby="organization-details-title">
          <SectionHeader title="Datos de la organización" id="organization-details-title" />
          <Card className="p-5 sm:p-6"><OrganizationNameForm key={organization.name} organizationId={organizationId} currentName={organization.name} /></Card>
        </section>

        <section aria-labelledby="organization-domains-title">
          <SectionHeader title="Dominios aprobados" id="organization-domains-title" meta={`${organization.approvedDomains.length} ${organization.approvedDomains.length === 1 ? "dominio" : "dominios"}`} />
          <Card className="p-5 sm:p-6">
            {organization.approvedDomains.length === 0
              ? <EmptyState title="Sin dominios aprobados" description="Agrega un dominio institucional antes de asignar miembros." align="start" />
              : <ul className="divide-y divide-hairline">
                  {organization.approvedDomains.map((domain) => <li key={domain} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-0 break-all pt-2 font-mono text-control text-ink">{domain}</span>
                    <RemoveOrganizationDomainAction domain={domain} />
                  </li>)}
                </ul>}
            <div className="mt-6 border-t border-hairline pt-5">
              <AddOrganizationDomainForm organizationId={organizationId} />
            </div>
          </Card>
        </section>

        <section aria-labelledby="organization-status-title">
          <SectionHeader title="Estado de la organización" id="organization-status-title" />
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Badge tone={organization.isActive ? "success" : "neutral"}>{organization.isActive ? "Activa" : "Inactiva"}</Badge>
              <p className="text-control text-ink-muted">
                {organization.isActive ? "Sus miembros pueden acceder si sus membresías están activas." : "Sus miembros no pueden acceder mientras permanezca inactiva."}
              </p>
            </div>
            <OrganizationStatusAction organizationId={organizationId} isActive={organization.isActive} />
          </Card>
        </section>
      </div>

      <section aria-labelledby="organization-members-title">
        <SectionHeader title="Miembros" id="organization-members-title" meta={`${members.length} ${members.length === 1 ? "persona" : "personas"}`} />
        {members.length === 0
          ? <EmptyState title="Todavía no hay miembros" description="Los usuarios asignados a esta organización aparecerán aquí." align="start" />
          : <div className="grid gap-3">
              {members.map((member) => <Card key={member.userId} as="article" className="p-4">
                <p className="break-all font-semibold text-ink">{member.email || "Correo no disponible"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge tone={member.role === "Admin" ? "primary" : "neutral"}>{member.role === "Admin" ? "Administrador" : "Miembro"}</Badge>
                  <Badge tone={member.isActive ? "success" : "neutral"}>{member.isActive ? "Activo" : "Inactivo"}</Badge>
                </div>
              </Card>)}
            </div>}
      </section>
    </div>
  </Page>;
}
