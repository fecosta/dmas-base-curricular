"use client";

import { useActionState } from "react";
import { requestCode, verifyCode } from "./actions";

export function LoginForm() {
  const [request, requestAction, requesting] = useActionState(requestCode, {});
  const [verification, verifyAction, verifying] = useActionState(verifyCode, {});

  return <div className="mt-6 space-y-6">
    <form action={requestAction} noValidate className="space-y-4">
      <label className="block font-medium" htmlFor="email">Correo institucional
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      {request.error && <p role="alert">{request.error}</p>}
      <button type="submit" disabled={requesting}>{requesting ? "Enviando…" : "Enviar código"}</button>
    </form>
    {request.sent && <>
      <p role="status">Si tu cuenta está habilitada, recibirás un código por correo. Puede tardar unos minutos. Espera un minuto antes de solicitar otro.</p>
      <form action={verifyAction} noValidate className="space-y-4">
        <input type="hidden" name="email" value={request.email} />
        <label className="block font-medium" htmlFor="token">Código de acceso
          <input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={8} />
        </label>
        {verification.error && <p role="alert">{verification.error}</p>}
        <button type="submit" disabled={verifying}>{verifying ? "Verificando…" : "Ingresar"}</button>
      </form>
    </>}
  </div>;
}
