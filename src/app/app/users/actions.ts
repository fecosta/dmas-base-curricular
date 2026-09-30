"use server";

import { revalidatePath } from "next/cache";
import { requireAccess } from "@/lib/auth/access";
import { AdminManagementError, provisionUser, reassignUserOrganization, setUserActive, setUserRole } from "@/lib/admin-management";

export type UserActionState = { error?: string; success?: string };

async function runUserAction(
  operation: () => Promise<void | { status: "created" | "already_provisioned" }>,
  successMessage: (result: void | { status: "created" | "already_provisioned" }) => string,
  fallbackMessage: string,
): Promise<UserActionState> {
  await requireAccess("Admin");
  try {
    const result = await operation();
    revalidatePath("/app/users");
    revalidatePath("/app/organizations");
    return { success: successMessage(result) };
  } catch (error) {
    return { error: error instanceof AdminManagementError ? error.message : fallbackMessage };
  }
}

export async function provisionUserAction(_state: UserActionState, form: FormData): Promise<UserActionState> {
  return runUserAction(
    () => provisionUser(form.get("email"), form.get("organization_id"), form.get("role")),
    (result) => result && result.status === "already_provisioned" ? "El usuario ya estaba configurado con esos datos." : "Usuario agregado.",
    "No pudimos completar el acceso de este usuario.",
  );
}

export async function reassignUserOrganizationAction(_state: UserActionState, form: FormData): Promise<UserActionState> {
  return runUserAction(
    async () => { await reassignUserOrganization(form.get("user_id"), form.get("organization_id")); },
    () => "Organización del usuario actualizada.",
    "No pudimos cambiar la organización de este usuario.",
  );
}

export async function setUserRoleAction(_state: UserActionState, form: FormData): Promise<UserActionState> {
  return runUserAction(
    async () => { await setUserRole(form.get("user_id"), form.get("role")); },
    () => "Rol del usuario actualizado.",
    "No pudimos cambiar el rol de este usuario.",
  );
}

export async function setUserActiveAction(_state: UserActionState, form: FormData): Promise<UserActionState> {
  const rawStatus = form.get("is_active");
  const isActive = rawStatus === "true" ? true : rawStatus === "false" ? false : rawStatus;
  return runUserAction(
    async () => { await setUserActive(form.get("user_id"), isActive); },
    () => isActive === true ? "Usuario activado." : "Usuario desactivado.",
    "No pudimos cambiar el estado de este usuario.",
  );
}
