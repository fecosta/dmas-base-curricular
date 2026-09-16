import Link from "next/link";
import { requireAccess } from "@/lib/auth/access";
import { listLifecycleHistory } from "@/lib/contributions/queries";
import { isIdentityLifecycleEvent, lifecycleActionLabel, revisionTransition } from "@/lib/contributions/lifecycle";
import { contributionTypeLabel, contributionTypes, isContributionType, type LifecycleAction, type LifecycleEvent } from "@/lib/contributions/types";
import { formatGovernanceTimestamp } from "@/lib/ui/datetime";
import { Page } from "@/components/ui/page";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const actions: LifecycleAction[] = [
  "content_created", "revision_created", "revision_edited", "content_submitted",
  "draft_deleted", "content_published", "content_archived", "content_restored",
];

type Query = { [key: string]: string | string[] | undefined };

function single(query: Query, key: string) {
  const value = query[key];
  return typeof value === "string" ? value : "";
}

/** The trailing segment of a uuid, enough to tell governed identities apart in a list. */
function shortId(id: string) {
  return id.slice(-12);
}

function EventEntry({ event, identityScoped }: { event: LifecycleEvent; identityScoped: boolean }) {
  const transition = revisionTransition(event);
  const identityEvent = isIdentityLifecycleEvent(event.action);
  return <Card as="li" className="p-5">
    <div className="flex flex-wrap items-center gap-3">
      <h2 className="text-lg">{lifecycleActionLabel(event.action)}</h2>
      {/* Identity and revision events are labelled, not merely styled: archive and
          restore act on the stable identity and record no revision transition. */}
      <Badge tone={identityEvent ? "neutral" : "info"}>{identityEvent ? "Identidad" : "Versión"}</Badge>
    </div>

    <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="filter-label">Contenido</dt>
        <dd className="mt-1">
          {identityScoped
            ? <span className="font-bold text-ink">{contributionTypeLabel(event.type)} · {shortId(event.contentId)}</span>
            : <Link
                href={`/app/contributions/history?type=${event.type}&content=${event.contentId}`}
                prefetch={false}
                className="font-bold"
              >{contributionTypeLabel(event.type)} · {shortId(event.contentId)}</Link>}
        </dd>
      </div>
      <div>
        <dt className="filter-label">Fecha</dt>
        <dd className="mt-1 text-ink-soft">{formatGovernanceTimestamp(event.occurredAt)}</dd>
      </div>
      {transition && <div>
        <dt className="filter-label">Cambio de versión</dt>
        <dd className="mt-1 text-ink-soft">
          {transition.previous ? `${transition.previous} → ` : "→ "}{transition.resulting ?? "—"}
        </dd>
      </div>}
      {event.revisionId && <div>
        <dt className="filter-label">{identityEvent ? "Versión vigente al momento" : "Versión"}</dt>
        <dd className="mt-1 text-ink-soft">{shortId(event.revisionId)}</dd>
      </div>}
      <div>
        <dt className="filter-label">Organización</dt>
        {/* Organization name where the RPC resolved one; otherwise its id. No actor
            email, name or auth metadata is exposed by the boundary. */}
        <dd className="mt-1 text-ink-soft">{event.actorOrganizationName ?? shortId(event.actorOrganizationId)}</dd>
      </div>
      <div>
        <dt className="filter-label">Persona responsable</dt>
        <dd className="mt-1 text-ink-soft">{shortId(event.actorUserId)}</dd>
      </div>
    </dl>
  </Card>;
}

export default async function GovernanceHistoryPage({ searchParams }: { searchParams: Promise<Query> }) {
  await requireAccess("Admin");
  const query = await searchParams;
  const typeParam = single(query, "type");
  const actionParam = single(query, "action");
  const contentId = single(query, "content");
  const beforeParam = single(query, "before");

  const type = isContributionType(typeParam) ? typeParam : undefined;
  const action = actions.includes(actionParam as LifecycleAction) ? actionParam as LifecycleAction : undefined;
  const before = /^\d+$/.test(beforeParam) ? Number(beforeParam) : null;
  const identityScoped = Boolean(contentId);

  const { events, nextCursor } = await listLifecycleHistory({ type, action, contentId: contentId || undefined, beforeEventId: before });

  const historyHref = (overrides: { before?: number | null }) => {
    const params = new URLSearchParams();
    if (typeParam) params.set("type", typeParam);
    if (actionParam) params.set("action", actionParam);
    if (contentId) params.set("content", contentId);
    const nextBefore = overrides.before;
    if (nextBefore) params.set("before", String(nextBefore));
    const queryString = params.toString();
    return queryString ? `/app/contributions/history?${queryString}` : "/app/contributions/history";
  };

  return <Page width="content">
    <PageHeader
      eyebrow="Gestión editorial"
      title="Historial de gobernanza"
      lede={identityScoped
        ? "Acciones registradas sobre este contenido, de la más reciente a la más antigua."
        : "Acciones registradas sobre el conocimiento curricular, de la más reciente a la más antigua."}
      actions={<ButtonLink href="/app/contributions" variant="secondary">Volver a administrar contenido</ButtonLink>}
    />

    {identityScoped && <p className="mt-6 rounded-md border border-hairline bg-inset px-4 py-3 text-sm">
      Filtrado por un contenido específico{type ? ` (${contributionTypeLabel(type)})` : ""}.{" "}
      <Link href="/app/contributions/history" prefetch={false} className="font-bold">Ver todo el historial</Link>
    </p>}

    {/* Filters are a GET form so every history view stays linkable. The identity
        filter travels as a hidden field to survive a type/action change. */}
    <form method="get" className="mt-8 rounded-lg border border-hairline bg-surface p-5 shadow-card">
      {contentId && <input type="hidden" name="content" value={contentId} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tipo de contenido">
          <select name="type" defaultValue={typeParam}>
            <option value="">Todos los tipos</option>
            {contributionTypes.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
          </select>
        </Field>
        <Field label="Acción">
          <select name="action" defaultValue={actionParam}>
            <option value="">Todas las acciones</option>
            {actions.map((item) => <option key={item} value={item}>{lifecycleActionLabel(item)}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit">Aplicar filtros</Button>
        {(typeParam || actionParam || before) && <Link href={historyHref({ before: null })} prefetch={false} className="text-sm font-bold">
          {before ? "Volver a los eventos más recientes" : "Limpiar"}
        </Link>}
      </div>
    </form>

    {events.length === 0
      ? <EmptyState
          className="mt-10"
          title="Sin eventos para estos filtros"
          description="Ajusta el tipo o la acción para encontrar el historial que buscas."
        />
      : <ol className="mt-10 space-y-4">
          {events.map((event) => <EventEntry key={event.eventId} event={event} identityScoped={identityScoped} />)}
        </ol>}

    {nextCursor && <p className="mt-8">
      <Link href={historyHref({ before: nextCursor })} prefetch={false} className="font-bold">Ver eventos anteriores</Link>
    </p>}
  </Page>;
}
