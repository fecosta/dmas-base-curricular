import Link from "next/link";
import { listAdminOrganizations } from "@/lib/admin-management";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader, resultCount } from "@/components/ui/section-header";
import { CreateOrganizationForm } from "./management-forms";

type Query = { [key: string]: string | string[] | undefined };

function single(query: Query, key: string): string {
  return typeof query[key] === "string" ? query[key] : "";
}

function OrganizationCard({ organization }: {
  organization: Awaited<ReturnType<typeof listAdminOrganizations>>[number];
}) {
  const shownDomains = organization.approvedDomains.slice(0, 3);
  const extraDomains = organization.approvedDomains.length - shownDomains.length;

  return <Card as="article" className="flex min-w-0 flex-col gap-5 p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="break-words text-card font-bold">{organization.name}</h3>
        <p className="mt-1 text-control text-ink-muted">
          {organization.memberCount} {organization.memberCount === 1 ? "miembro" : "miembros"}
        </p>
      </div>
      <Badge tone={organization.isActive ? "success" : "neutral"}>
        {organization.isActive ? "Activa" : "Inactiva"}
      </Badge>
    </div>

    <div>
      <p className="filter-label">Dominios aprobados · {organization.approvedDomains.length}</p>
      {shownDomains.length > 0
        ? <div className="mt-2 flex flex-wrap gap-2">
            {shownDomains.map((domain) => <Badge key={domain} tone="info">{domain}</Badge>)}
            {extraDomains > 0 && <span className="self-center text-control text-ink-muted">+{extraDomains}</span>}
          </div>
        : <p className="mt-2 text-control text-ink-muted">Sin dominios aprobados</p>}
    </div>

    <div className="mt-auto border-t border-hairline pt-4">
      <Link href={`/app/organizations/${organization.organizationId}`} prefetch={false}
        className="text-control font-bold">Gestionar organización</Link>
    </div>
  </Card>;
}

export default async function OrganizationsPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const search = single(query, "q").trim();
  const organizations = await listAdminOrganizations();
  const filtered = search
    ? organizations.filter((organization) => organization.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()))
    : organizations;

  return <Page width="content">
    <PageHeader
      eyebrow="Administración"
      title="Organizaciones"
      lede="Gestiona las organizaciones, los dominios aprobados y el acceso de sus miembros."
    />

    <section aria-labelledby="create-organization-title" className="mt-8">
      <SectionHeader title="Agregar organización" id="create-organization-title" />
      <Card className="p-5 sm:p-6"><CreateOrganizationForm /></Card>
    </section>

    <section aria-labelledby="organizations-title" className="mt-10">
      <SectionHeader title="Organizaciones registradas" id="organizations-title" meta={resultCount(filtered.length)} />
      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <Field label="Buscar organización">
          <input type="search" name="q" defaultValue={search} placeholder="Nombre de la organización…" />
        </Field>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>

      {filtered.length === 0
        ? <EmptyState
            title={organizations.length === 0 ? "Todavía no hay organizaciones" : "Sin organizaciones para esta búsqueda"}
            description={organizations.length === 0
              ? "Agrega una organización y al menos un dominio institucional aprobado para comenzar."
              : "Prueba con otro nombre o limpia la búsqueda."}
            action={search ? <Link href="/app/organizations" prefetch={false} className="font-bold">Limpiar búsqueda</Link> : undefined}
          />
        : <div className="grid gap-4 md:grid-cols-2">{filtered.map((organization) =>
            <OrganizationCard key={organization.organizationId} organization={organization} />
          )}</div>}
    </section>
  </Page>;
}
