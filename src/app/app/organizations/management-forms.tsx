"use client";

import { useActionState, useState } from "react";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  addOrganizationDomainAction,
  createOrganizationAction,
  removeOrganizationDomainAction,
  setOrganizationActiveAction,
  type OrganizationActionState,
} from "./actions";

const initialState: OrganizationActionState = {};

export function CreateOrganizationForm() {
  const [state, action, pending] = useActionState(createOrganizationAction, initialState);
  const [name, setName] = useState("");
  const [domains, setDomains] = useState("");

  return <form action={action} className="grid gap-4">
    <Field label="Nombre de la organización">
      <input name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required />
    </Field>
    <Field label="Dominios aprobados" hint="Escribe un dominio por línea. Cada dominio debe pertenecer a una sola organización.">
      <textarea name="domains" value={domains} onChange={(event) => setDomains(event.target.value)} rows={3} required />
    </Field>
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={pending}>{pending ? "Creando…" : "Crear organización"}</Button>
      {state.success && <Notice tone="success">{state.success}</Notice>}
    </div>
    {state.error && <Notice tone="error">{state.error}</Notice>}
  </form>;
}

export function AddOrganizationDomainForm({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(addOrganizationDomainAction, initialState);
  const [domain, setDomain] = useState("");

  return <form action={action} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
    <input type="hidden" name="organization_id" value={organizationId} />
    <Field label="Agregar dominio aprobado">
      <input name="domain" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="ejemplo.org" maxLength={253} required />
    </Field>
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>{pending ? "Agregando…" : "Agregar dominio"}</Button>
    {state.error && <Notice tone="error" className="sm:col-span-2">{state.error}</Notice>}
    {state.success && <Notice tone="success" className="sm:col-span-2">{state.success}</Notice>}
  </form>;
}

export function RemoveOrganizationDomainAction({ domain }: { domain: string }) {
  const [state, action, pending] = useActionState(removeOrganizationDomainAction, initialState);
  const [confirming, setConfirming] = useState(false);

  return <div className="min-w-0">
    {!confirming
      ? <Button type="button" variant="ghost" size="xs" onClick={() => setConfirming(true)}>Retirar dominio</Button>
      : <div className="rounded-lg border border-warning/35 bg-warning/8 p-3 sm:max-w-md">
          <p className="text-control font-bold">¿Retirar {domain}?</p>
          <p className="mt-2 text-sm text-ink-soft">
            Las personas cuyo correo usa este dominio pueden perder acceso en su siguiente verificación. Sus membresías se conservarán.
          </p>
          <form action={action} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="domain" value={domain} />
            <Button type="submit" size="xs" variant="secondary" disabled={pending}>
              {pending ? "Retirando…" : "Confirmar retiro"}
            </Button>
            <Button type="button" size="xs" variant="ghost" onClick={() => setConfirming(false)}>Cancelar</Button>
          </form>
        </div>}
    {state.error && <Notice tone="error" className="mt-2">{state.error}</Notice>}
    {state.success && <Notice tone="success" className="mt-2">{state.success}</Notice>}
  </div>;
}

export function OrganizationStatusAction({ organizationId, isActive }: { organizationId: string; isActive: boolean }) {
  return isActive
    ? <DeactivateOrganizationAction organizationId={organizationId} />
    : <ActivateOrganizationAction organizationId={organizationId} />;
}

function ActivateOrganizationAction({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(setOrganizationActiveAction, initialState);

  return <div>
    <form action={action}>
      <input type="hidden" name="organization_id" value={organizationId} />
      <input type="hidden" name="is_active" value="true" />
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>{pending ? "Activando…" : "Activar organización"}</Button>
    </form>
    {state.error && <Notice tone="error" className="mt-3">{state.error}</Notice>}
    {state.success && <Notice tone="success" className="mt-3">{state.success}</Notice>}
  </div>;
}

function DeactivateOrganizationAction({ organizationId }: { organizationId: string }) {
  const [state, action, pending] = useActionState(setOrganizationActiveAction, initialState);
  const [confirming, setConfirming] = useState(false);

  return <div>
    {!confirming
      ? <Button type="button" variant="secondary" size="sm" onClick={() => setConfirming(true)}>Desactivar organización</Button>
      : <div className="rounded-lg border border-warning/35 bg-warning/8 p-4">
          <p className="font-bold text-ink">¿Desactivar esta organización?</p>
          <p className="mt-2 text-body text-ink-soft">
            Sus miembros perderán acceso mientras permanezca inactiva. El estado individual de cada membresía se conservará.
          </p>
          <form action={action} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="organization_id" value={organizationId} />
            <input type="hidden" name="is_active" value="false" />
            <Button type="submit" size="sm" variant="secondary" disabled={pending}>{pending ? "Desactivando…" : "Confirmar desactivación"}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancelar</Button>
          </form>
        </div>}
    {state.error && <Notice tone="error" className="mt-3">{state.error}</Notice>}
    {state.success && <Notice tone="success" className="mt-3">{state.success}</Notice>}
  </div>;
}
