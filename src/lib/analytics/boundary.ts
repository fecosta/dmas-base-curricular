import { analyticsEvents, contentTypes, filterTypes, type AnalyticsEvent, type AnalyticsIdentity, type AnalyticsProperties } from "./contract";
import { analyticsEnvironmentAllowed, postHogCaptureUrl, postHogProjectKey } from "./config";

type Generation = { identity: { userId: string; organizationId: string }; requests: Set<AbortController> };
let current: Generation | null = null;
let environment: NodeJS.ProcessEnv = process.env;
let dispatch: typeof fetch = (...args) => fetch(...args);
const uuid = (value: unknown): value is string => typeof value === "string"
  && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

function retire() {
  const previous = current;
  current = null;
  for (const controller of previous?.requests ?? []) controller.abort();
}

/** Test-only injection; never used to bypass production eligibility in application code. */
export function configureAnalyticsForTest(options: { env?: NodeJS.ProcessEnv; fetch?: typeof fetch } = {}) {
  retire();
  environment = options.env ?? process.env;
  dispatch = options.fetch ?? ((...args) => fetch(...args));
}

export function analyticsActive() {
  return current !== null && analyticsEnvironmentAllowed(environment);
}

export function enable(identity: AnalyticsIdentity) {
  try {
    const userId = Object.getOwnPropertyDescriptor(identity, "userId")?.value;
    const organizationId = Object.getOwnPropertyDescriptor(identity, "organizationId")?.value;
    if (!analyticsEnvironmentAllowed(environment) || !uuid(userId) || !uuid(organizationId)) {
      retire();
      return;
    }
    if (current?.identity.userId === userId && current.identity.organizationId === organizationId) return;
    retire();
    current = { identity: { userId, organizationId }, requests: new Set() };
  } catch { retire(); }
}

export function disable() { retire(); }

/** Construct only validated, own data properties; never inspect inherited or accessor values. */
function propertiesFor(event: unknown, input: unknown): Record<string, string | number | boolean> | null {
  if (typeof event !== "string" || !(analyticsEvents as readonly string[]).includes(event)) return null;
  if (input === null || typeof input !== "object" || Array.isArray(input)) return null;
  try {
    const prototype = Object.getPrototypeOf(input);
    if (prototype !== Object.prototype && prototype !== null) return null;
    const schema: Record<AnalyticsEvent, readonly string[]> = {
      library_viewed: [], search_performed: ["result_count", "has_results"],
      filter_applied: ["filter_type"], content_opened: ["content_id", "content_type"],
      external_reference_opened: ["content_id", "content_type"],
      content_downloaded: ["attachment_id", "content_id", "content_type"],
    };
    const keys = Reflect.ownKeys(input);
    const allowed = schema[event as AnalyticsEvent];
    if (keys.length !== allowed.length || keys.some((key) => typeof key !== "string" || !allowed.includes(key))) return null;
    const data: Record<string, unknown> = Object.create(null);
    for (const key of allowed) {
      const field = Object.getOwnPropertyDescriptor(input, key);
      if (!field || !("value" in field) || !field.enumerable) return null;
      data[key] = field.value;
    }
    if (event === "search_performed" && (!Number.isSafeInteger(data.result_count) || (data.result_count as number) < 0
      || typeof data.has_results !== "boolean" || data.has_results !== ((data.result_count as number) > 0))) return null;
    if (event === "filter_applied" && !filterTypes.includes(data.filter_type as typeof filterTypes[number])) return null;
    if (allowed.includes("content_id") && (!uuid(data.content_id) || !contentTypes.includes(data.content_type as typeof contentTypes[number]))) return null;
    if (allowed.includes("attachment_id") && !uuid(data.attachment_id)) return null;
    return { ...data } as Record<string, string | number | boolean>;
  } catch { return null; }
}

/** One dispatch per valid event. Telemetry failures never affect the interaction. */
export function track<Event extends AnalyticsEvent>(event: Event, properties: AnalyticsProperties[Event] = {} as AnalyticsProperties[Event]) {
  const generation = current;
  if (!generation || !analyticsEnvironmentAllowed(environment)) return;
  const approved = propertiesFor(event, properties);
  const key = postHogProjectKey(environment);
  if (!approved || !key) return;
  const controller = new AbortController();
  generation.requests.add(controller);
  const timeout = setTimeout(() => { controller.abort(); generation.requests.delete(controller); }, 5000);
  try {
    const body = JSON.stringify({ api_key: key, event, distinct_id: generation.identity.userId,
      timestamp: new Date().toISOString(), properties: { "$process_person_profile": false,
        organization_id: generation.identity.organizationId, environment: "production", ...approved } });
    // text/plain is a CORS-simple content type accepted by the Capture endpoint.
    void Promise.resolve(dispatch(postHogCaptureUrl, { method: "POST", body,
      headers: { "Content-Type": "text/plain" }, credentials: "omit", referrerPolicy: "no-referrer",
      cache: "no-store", keepalive: false, signal: controller.signal }))
      .catch(() => {}).finally(() => { clearTimeout(timeout); generation.requests.delete(controller); });
  } catch {
    clearTimeout(timeout);
    generation.requests.delete(controller);
  }
}
