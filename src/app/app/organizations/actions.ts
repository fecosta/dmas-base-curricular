"use server";

import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth/access";
import { AdminManagementError, addOrganizationDomain, createOrganization, removeOrganizationDomain, setOrganizationActive, updateOrganizationName } from "@/lib/admin-management";

export type OrganizationActionState = { error?: string; success?: string };

function submittedDomains(form: FormData): unknown[] {
  const domains: unknown[] = [];
  for (const value of form.getAll("domains")) {
    if (typeof value !== "string") {
      domains.push(value);
      continue;
    }
    domains.push(...value.split(/\r?\n/).map((domain) => domain.trim()).filter(Boolean));
  }
  return domains;
}

async function runOrganizationAction(
  operation: () => Promise<void | string>,
  successMessage: (result: void | string) => string,
  fallbackMessage: string,
): Promise<OrganizationActionState> {
  await requireAccess("Admin");
  try {
    const result = await operation();
    revalidatePath("/app/organizations");
    revalidatePath("/app/users");
    return { success: successMessage(result) };
  } catch (error) {
    return { error: error instanceof AdminManagementError ? error.message : fallbackMessage };
  }
}

export async function createOrganizationAction(_state: OrganizationActionState, form: FormData): Promise<OrganizationActionState> {
  return runOrganizationAction(
    async () => { await createOrganization(form.get("name"), submittedDomains(form)); },
    () => "Organización creada.",
    "No pudimos crear la organización.",
  );
}

export async function updateOrganizationNameAction(_state: OrganizationActionState, form: FormData): Promise<OrganizationActionState> {
  return runOrganizationAction(
    () => updateOrganizationName(form.get("organization_id"), form.get("name")),
    () => "Nombre de la organización actualizado.",
    "No pudimos actualizar la organización.",
  );
}

export async function addOrganizationDomainAction(_state: OrganizationActionState, form: FormData): Promise<OrganizationActionState> {
  return runOrganizationAction(
    () => addOrganizationDomain(form.get("organization_id"), form.get("domain")),
    () => "Dominio aprobado agregado.",
    "No pudimos agregar el dominio aprobado.",
  );
}

export async function removeOrganizationDomainAction(_state: OrganizationActionState, form: FormData): Promise<OrganizationActionState> {
  return runOrganizationAction(
    () => removeOrganizationDomain(form.get("domain")),
    () => "Dominio aprobado retirado.",
    "No pudimos retirar el dominio aprobado.",
  );
}

export async function setOrganizationActiveAction(_state: OrganizationActionState, form: FormData): Promise<OrganizationActionState> {
  const rawStatus = form.get("is_active");
  const isActive = rawStatus === "true" ? true : rawStatus === "false" ? false : rawStatus;
  return runOrganizationAction(
    () => setOrganizationActive(form.get("organization_id"), isActive),
    () => isActive === true ? "Organización activada." : "Organización desactivada.",
    "No pudimos cambiar el estado de la organización.",
  );
}
