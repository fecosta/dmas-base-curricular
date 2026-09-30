import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader, resultCount } from "@/components/ui/section-header";
import { listAdminOrganizations, listAdminUsers, type ManagedUserFilters } from "@/lib/admin-management";
import { ProvisionUserForm, UserManagementCard } from "./user-management";

type Query = { [key: string]: string | string[] | undefined };

function single(query: Query, key: string): string {
  return typeof query[key] === "string" ? query[key] : "";
}

function hrefWithFilters(filters: ManagedUserFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.email) params.set("email", filters.email);
  if (filters.organizationId) params.set("organization", filters.organizationId);
  if (filters.role) params.set("role", filters.role);
  if (filters.isActive !== undefined) params.set("status", filters.isActive ? "active" : "inactive");
  if (page > 0) params.set("page", String(page + 1));
  return params.size > 0 ? `/app/users?${params.toString()}` : "/app/users";
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<Query> }) {
  const query = await searchParams;
  const email = single(query, "email");
  const requestedOrganization = single(query, "organization");
  const requestedRole = single(query, "role");
  const requestedStatus = single(query, "status");
  const pageText = single(query, "page");
  const pageNumber = /^\d+$/.test(pageText) && Number(pageText) > 0 ? Number(pageText) - 1 : 0;
  const role = requestedRole === "Admin" || requestedRole === "Contributor" ? requestedRole : undefined;
  const isActive = requestedStatus === "active" ? true : requestedStatus === "inactive" ? false : undefined;
  const organizations = await listAdminOrganizations();
  const organizationId = organizations.some((item) => item.organizationId === requestedOrganization) ? requestedOrganization : undefined;
  const filters: ManagedUserFilters = { email, organizationId, role, isActive, page: pageNumber };
  const { users, page, hasNextPage } = await listAdminUsers(filters);

  return <Page width="content">
    <PageHeader
      eyebrow="Administración"
      title="Usuarios"
      lede="Administra las membresías de la red. El correo de acceso pertenece a la cuenta de autenticación y no se edita aquí."
    />

    <div className="mt-8"><ProvisionUserForm organizations={organizations} /></div>

    <section aria-labelledby="users-list-title" className="mt-10">
      <SectionHeader title="Miembros de la red" id="users-list-title" meta={resultCount(users.length)} />
      <form method="get" className="grid gap-4 rounded-xl border border-hairline bg-surface p-4 shadow-panel sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto] lg:items-end">
        <Field label="Buscar por correo">
          <input type="search" name="email" defaultValue={email} placeholder="Correo institucional…" />
        </Field>
        <Field label="Organización">
          <select name="organization" defaultValue={organizationId ?? ""}>
            <option value="">Todas las organizaciones</option>
            {organizations.map((organization) => <option key={organization.organizationId} value={organization.organizationId}>
              {organization.name}{organization.isActive ? "" : " · Inactiva"}
            </option>)}
          </select>
        </Field>
        <Field label="Rol">
          <select name="role" defaultValue={role ?? ""}>
            <option value="">Todos los roles</option>
            <option value="Contributor">Miembro</option>
            <option value="Admin">Administrador</option>
          </select>
        </Field>
        <Field label="Estado">
          <select name="status" defaultValue={requestedStatus === "active" || requestedStatus === "inactive" ? requestedStatus : ""}>
            <option value="">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </Field>
        <Button type="submit" size="sm">Aplicar filtros</Button>
      </form>

      <p className="mt-4 text-control text-ink-muted">
        {page === 0 ? "Página 1" : `Página ${page + 1}`} · se muestran hasta 100 membresías por página.
      </p>

      {users.length === 0
        ? <EmptyState
            className="mt-6"
            title={email || organizationId || role || isActive !== undefined ? "Sin usuarios para estos filtros" : "Todavía no hay usuarios"}
            description="Ajusta los filtros o agrega una persona a una organización con el dominio institucional correspondiente."
          />
        : <div className="mt-6 grid gap-3">{users.map((user) => <UserManagementCard
            key={`${user.userId}-${user.organizationId}-${user.role}-${user.isActive}`}
            user={user}
            organizations={organizations}
          />)}</div>}

      {(page > 0 || hasNextPage) && <nav aria-label="Páginas de usuarios" className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {page > 0
          ? <Link href={hrefWithFilters(filters, page - 1)} prefetch={false} className="text-control font-bold">Página anterior</Link>
          : <span />}
        {hasNextPage && <Link href={hrefWithFilters(filters, page + 1)} prefetch={false} className="text-control font-bold">Página siguiente</Link>}
      </nav>}
      {requestedOrganization && !organizationId && <p className="sr-only">El filtro de organización indicado no es válido.</p>}
      {requestedRole && !role && <p className="sr-only">El filtro de rol indicado no es válido.</p>}
      {requestedStatus && requestedStatus !== "active" && requestedStatus !== "inactive" && <p className="sr-only">El filtro de estado indicado no es válido.</p>}
    </section>
  </Page>;
}
