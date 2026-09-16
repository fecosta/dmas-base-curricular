import { requireAccess } from "@/lib/auth/access";
import { Page, Container } from "@/components/ui/page";
import { HeroBand } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export default async function ApplicationPage() {
  const access = await requireAccess();
  return <Page width="bleed">
    <HeroBand
      size="tall"
      eyebrow="Red de formación política"
      title="Una biblioteca para fortalecer la democracia."
      lede="Explora módulos curriculares y referencias publicadas por la red Democracia+."
      actions={<ButtonLink href="/app/library" variant="on-dark">Explorar la biblioteca</ButtonLink>}
    />

    <Container width="wide" className="grid gap-6 py-12 lg:grid-cols-[1fr_22rem] lg:py-16">
      <div className="grid gap-6 sm:grid-cols-2">
        <Card accent="primary" className="p-6">
          <p className="text-4xl font-black tracking-tight text-primary">2</p>
          <p className="mt-2 text-ink-soft">Ejes curriculares iniciales</p>
        </Card>
        <Card accent="success" className="p-6">
          <p className="text-4xl font-black tracking-tight text-success-ink">Una red</p>
          <p className="mt-2 text-ink-soft">Contenido publicado disponible para miembros elegibles.</p>
        </Card>
      </div>

      <Card as="section" aria-labelledby="account-title" className="p-6">
        <h2 id="account-title" className="text-lg">Tu cuenta</h2>
        <dl className="mt-4 space-y-4">
          <div>
            <dt className="filter-label">Correo institucional</dt>
            <dd className="mt-1 break-words">{access.email}</dd>
          </div>
          <div>
            <dt className="filter-label">Organización</dt>
            <dd className="mt-1">{access.organizationName}</dd>
          </div>
          <div>
            <dt className="filter-label">Rol</dt>
            <dd className="mt-1">{access.role === "Admin" ? "Administrador" : "Miembro"}</dd>
          </div>
        </dl>
      </Card>
    </Container>
  </Page>;
}
