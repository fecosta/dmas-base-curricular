"use client";

import { useActionState } from "react";
import { requestCode, signInWithGoogle, verifyCode } from "./actions";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

export function LoginForm() {
  const [request, requestAction, requesting] = useActionState(requestCode, {});
  const [verification, verifyAction, verifying] = useActionState(verifyCode, {});

  return <div className="mt-6 space-y-6">
    {/*
      Google stays the first button in DOM order on this page: the E2E suite
      asserts getByRole("button").first() is exactly "Continuar con Google".
    */}
    <form action={signInWithGoogle}>
      <Button type="submit" className="w-full">Continuar con Google</Button>
    </form>
    <div className="flex items-center gap-3 text-sm text-ink-muted" aria-hidden="true">
      <span className="h-px flex-1 bg-hairline" />
      <span>o usa un código por correo</span>
      <span className="h-px flex-1 bg-hairline" />
    </div>
    <form action={requestAction} noValidate className="space-y-4">
      <label className="filter-label block" htmlFor="email">Correo institucional
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      {request.error && <Notice tone="error">{request.error}</Notice>}
      <Button type="submit" disabled={requesting} variant="secondary" className="w-full">{requesting ? "Enviando…" : "Enviar código"}</Button>
    </form>
    {request.sent && <>
      <Notice tone="success">Si tu cuenta está habilitada, recibirás un código por correo. Puede tardar unos minutos. Espera un minuto antes de solicitar otro.</Notice>
      <form action={verifyAction} noValidate className="space-y-4">
        <input type="hidden" name="email" value={request.email} />
        <label className="filter-label block" htmlFor="token">Código de acceso
          <input id="token" name="token" inputMode="numeric" autoComplete="one-time-code" required minLength={6} maxLength={8} />
        </label>
        {verification.error && <Notice tone="error">{verification.error}</Notice>}
        <Button type="submit" disabled={verifying} className="w-full">{verifying ? "Verificando…" : "Ingresar"}</Button>
      </form>
    </>}
  </div>;
}
