"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { updateOrganizationNameAction, type OrganizationActionState } from "./actions";

const initialState: OrganizationActionState = {};
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** Wait for hydration before enabling edits so the controlled Server Action form submits its live value. */
export function OrganizationNameForm({ organizationId, currentName }: { organizationId: string; currentName: string }) {
  const [state, action, pending] = useActionState(updateOrganizationNameAction, initialState);
  const [name, setName] = useState(currentName);
  const isHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  return <form action={action} data-client-ready={isHydrated ? "true" : undefined} className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
    <input type="hidden" name="organization_id" value={organizationId} />
    <Field label="Nombre de la organización">
      <input name="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={200} required disabled={!isHydrated || pending} />
    </Field>
    <Button type="submit" variant="secondary" size="sm" disabled={!isHydrated || pending || name.trim() === currentName}>
      {pending ? "Guardando…" : "Guardar nombre"}
    </Button>
    {state.error && <Notice tone="error" className="sm:col-span-2">{state.error}</Notice>}
    {state.success && <Notice tone="success" className="sm:col-span-2">{state.success}</Notice>}
  </form>;
}
