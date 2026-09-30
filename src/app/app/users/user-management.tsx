"use client";

import { useActionState, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import type { ManagedUser, OrganizationSummary } from "@/lib/admin-management";
import { provisionUserAction, setUserActiveAction, setUserRoleAction, reassignUserOrganizationAction, type UserActionState } from "./actions";

const initialState: UserActionState = {};

function roleLabel(role: ManagedUser["role"]) {
  return role === "Admin" ? "Administrador" : "Miembro";
}

export function ProvisionUserForm({ organizations }: { organizations: OrganizationSummary[] }) {
  const [state, action, pending] = useActionState(provisionUserAction, initialState);
  const [email, setEmail] = useState("");
  const [organizationId, setOrganizationId] = useState(organizations.find((item) => item.isActive)?.organizationId ?? "");
  const [role, setRole] = useState<ManagedUser["role"]>("Contributor");

  const activeOrganizations = organizations.filter((organization) => organization.isActive);
  return <details id="provision-user" className="rounded-xl border border-hairline bg-surface shadow-panel">
    <summary className="cursor-pointer list-none px-5 py-4 text-control font-bold text-primary">Agregar usuario</summary>
    <div className="border-t border-hairline p-5 sm:p-6">
      {activeOrganizations.length === 0
        ? <Notice tone="warning">Activa una organización con dominios aprobados antes de agregar usuarios.</Notice>
        : <form action={action} className="grid gap-4 sm:grid-cols-2">
            <Field label="Correo de acceso">
              <input type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="off" required />
            </Field>
            <Field label="Organización">
              <select name="organization_id" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} required>
                <option value="" disabled>Selecciona una organización</option>
                {activeOrganizations.map((organization) => <option key={organization.organizationId} value={organization.organizationId}>{organization.name}</option>)}
              </select>
            </Field>
            <Field label="Rol">
              <select name="role" value={role} onChange={(event) => setRole(event.target.value as ManagedUser["role"])}>
                <option value="Contributor">Miembro</option>
                <option value="Admin">Administrador</option>
              </select>
            </Field>
            <div className="flex items-end">
              <Button type="submit" disabled={pending}>{pending ? "Agregando…" : "Agregar usuario"}</Button>
            </div>
            <div className="sm:col-span-2">
              {state.error && <Notice tone="error">{state.error}</Notice>}
              {state.success && <Notice tone="success">{state.success}</Notice>}
              <p className="mt-3 text-sm text-ink-muted">No se establece ni administra una contraseña. La persona ingresará con los métodos de acceso disponibles.</p>
            </div>
          </form>}
    </div>
  </details>;
}

export function UserManagementCard({ user, organizations }: { user: ManagedUser; organizations: OrganizationSummary[] }) {
  const [roleState, roleAction, rolePending] = useActionState(setUserRoleAction, initialState);
  const [organizationState, organizationAction, organizationPending] = useActionState(reassignUserOrganizationAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(setUserActiveAction, initialState);
  const [nextRole, setNextRole] = useState(user.role);
  const [nextOrganization, setNextOrganization] = useState(user.organizationId);
  const [confirmingRole, setConfirmingRole] = useState(false);
  const [confirmingOrganization, setConfirmingOrganization] = useState(false);
  const [confirmingDeactivation, setConfirmingDeactivation] = useState(false);

  const targetOrganizations = organizations.filter((organization) => organization.isActive || organization.organizationId === user.organizationId);
  const roleChange = nextRole !== user.role;
  const organizationChange = nextOrganization !== user.organizationId;

  return <Card as="article" className="p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="filter-label">Correo de acceso · no editable</p>
        <p className="mt-1 break-all font-semibold text-ink">{user.email || "Correo no disponible"}</p>
        <p className="mt-1 text-sm text-ink-muted">{user.organizationName}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge tone={user.role === "Admin" ? "primary" : "neutral"}>{roleLabel(user.role)}</Badge>
        <Badge tone={user.isActive ? "success" : "neutral"}>{user.isActive ? "Activo" : "Inactivo"}</Badge>
      </div>
    </div>

    <details className="mt-5 border-t border-hairline pt-4">
      <summary className="cursor-pointer text-control font-bold text-primary">Gestionar usuario</summary>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <section aria-label={`Cambiar organización de ${user.email}`} className="space-y-3">
          <form action={organizationAction}>
            <input type="hidden" name="user_id" value={user.userId} />
            <Field label="Organización">
              <select name="organization_id" value={nextOrganization} onChange={(event) => setNextOrganization(event.target.value)}>
                {targetOrganizations.map((organization) => <option key={organization.organizationId} value={organization.organizationId}>
                  {organization.name}{organization.isActive ? "" : " · Inactiva"}
                </option>)}
              </select>
            </Field>
            {organizationChange && !confirmingOrganization && <Button type="button" size="xs" variant="secondary" className="mt-3" onClick={() => setConfirmingOrganization(true)}>
              Cambiar organización
            </Button>}
            {confirmingOrganization && <div className="mt-3 rounded-lg border border-warning/35 bg-warning/8 p-3">
              <p className="text-sm font-bold">¿Reasignar a {targetOrganizations.find((item) => item.organizationId === nextOrganization)?.name}?</p>
              <p className="mt-2 text-sm text-ink-soft">La membresía cambiará a una sola organización y el dominio de acceso se verificará nuevamente.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="submit" size="xs" variant="secondary" disabled={organizationPending}>
                  {organizationPending ? "Guardando…" : "Confirmar reasignación"}
                </Button>
                <Button type="button" size="xs" variant="ghost" onClick={() => setConfirmingOrganization(false)}>Cancelar</Button>
              </div>
            </div>}
          </form>
          {organizationState.error && <Notice tone="error">{organizationState.error}</Notice>}
          {organizationState.success && <Notice tone="success">{organizationState.success}</Notice>}
        </section>

        <section aria-label={`Cambiar rol de ${user.email}`} className="space-y-3">
          <form action={roleAction}>
            <input type="hidden" name="user_id" value={user.userId} />
            <Field label="Rol">
              <select name="role" value={nextRole} onChange={(event) => setNextRole(event.target.value as ManagedUser["role"])}>
                <option value="Contributor">Miembro</option>
                <option value="Admin">Administrador</option>
              </select>
            </Field>
            {roleChange && !confirmingRole && <Button type="button" size="xs" variant="secondary" className="mt-3" onClick={() => setConfirmingRole(true)}>
              Cambiar rol
            </Button>}
            {confirmingRole && <div className="mt-3 rounded-lg border border-warning/35 bg-warning/8 p-3">
              <p className="text-sm font-bold">¿Cambiar de {roleLabel(user.role)} a {roleLabel(nextRole)}?</p>
              <p className="mt-2 text-sm text-ink-soft">El rol determina qué operaciones administrativas puede realizar esta persona.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="submit" size="xs" variant="secondary" disabled={rolePending}>
                  {rolePending ? "Guardando…" : "Confirmar cambio de rol"}
                </Button>
                <Button type="button" size="xs" variant="ghost" onClick={() => setConfirmingRole(false)}>Cancelar</Button>
              </div>
            </div>}
          </form>
          {roleState.error && <Notice tone="error">{roleState.error}</Notice>}
          {roleState.success && <Notice tone="success">{roleState.success}</Notice>}
        </section>
      </div>

      <div className="mt-6 border-t border-hairline pt-4">
        {user.isActive
          ? !confirmingDeactivation
            ? <Button type="button" size="xs" variant="secondary" onClick={() => setConfirmingDeactivation(true)}>Desactivar usuario</Button>
            : <div className="rounded-lg border border-warning/35 bg-warning/8 p-3">
                <p className="text-sm font-bold">¿Desactivar esta membresía?</p>
                <p className="mt-2 text-sm text-ink-soft">La persona perderá acceso; su cuenta, organización e historial se conservarán.</p>
                <form action={statusAction} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="user_id" value={user.userId} />
                  <input type="hidden" name="is_active" value="false" />
                  <Button type="submit" size="xs" variant="secondary" disabled={statusPending}>
                    {statusPending ? "Desactivando…" : "Confirmar desactivación"}
                  </Button>
                  <Button type="button" size="xs" variant="ghost" onClick={() => setConfirmingDeactivation(false)}>Cancelar</Button>
                </form>
              </div>
          : <form action={statusAction}>
              <input type="hidden" name="user_id" value={user.userId} />
              <input type="hidden" name="is_active" value="true" />
              <Button type="submit" size="xs" variant="secondary" disabled={statusPending}>
                {statusPending ? "Activando…" : "Activar usuario"}
              </Button>
            </form>}
        {statusState.error && <Notice tone="error" className="mt-3">{statusState.error}</Notice>}
        {statusState.success && <Notice tone="success" className="mt-3">{statusState.success}</Notice>}
      </div>
    </details>
  </Card>;
}
