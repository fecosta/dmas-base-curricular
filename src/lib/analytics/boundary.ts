import {
  isProhibitedProperty,
  type AnalyticsEvent,
  type AnalyticsIdentity,
  type AnalyticsProperties,
} from "./contract";
import { analyticsEnvironmentAllowed, postHogOptions, postHogProjectKey, resolveEnvironment } from "./config";

/**
 * The single analytics integration boundary.
 *
 * Every approved event in the application goes through `track`. No component
 * imports the provider, so there is one place where consent, environment,
 * taxonomy and property minimization are enforced, and one place to audit.
 *
 * The boundary is inert until `enable` is called with a resolved pseudonymous
 * identity, which the shell does only after authentication, authorization,
 * organization resolution and an affirmative *persisted* preference. Before
 * that — and after `disable` — every call is a no-op that returns normally.
 *
 * Analytics is non-critical: nothing here throws into product code. A missing
 * configuration, a blocked provider, a failed import or a provider exception
 * all degrade to "no telemetry" while the product continues.
 */

/** The provider surface this boundary uses. Narrow by design. */
type Provider = {
  init: (key: string, options: Record<string, unknown>) => void;
  // The boundary always supplies context, so these are never called bare.
  identify: (distinctId: string, properties: Record<string, unknown>) => void;
  capture: (event: string, properties: Record<string, unknown>) => void;
  reset: () => void;
  /**
   * The provider starts opted out by configuration, so capturing requires an
   * explicit opt-in. That call is the only place consent is translated into
   * provider state, and it happens after the preference is already persisted.
   */
  opt_in_capturing: () => void;
  opt_out_capturing?: () => void;
};

type Loader = () => Promise<Provider | null>;

/**
 * Loads the stable browser SDK on demand.
 *
 * Dynamic so the SDK is not in the initial bundle of a product whose users may
 * never enable analytics, and so a blocked or failed load is an ordinary
 * rejected promise rather than a page-breaking import.
 */
/** True when a candidate actually exposes the methods the boundary calls. */
function isProvider(candidate: unknown): candidate is Provider {
  const client = candidate as Partial<Provider> | null;
  return typeof client?.init === "function"
    && typeof client.identify === "function"
    && typeof client.capture === "function"
    && typeof client.reset === "function"
    && typeof client.opt_in_capturing === "function";
}

const loadPostHog: Loader = async () => {
  try {
    const imported = await import("posthog-js");
    /*
     * Chosen by capability rather than by position. Under CJS interop
     * `imported.default` can be the module namespace rather than the client
     * instance, so taking the first truthy candidate yields an object whose
     * methods are all undefined — analytics would appear wired and silently
     * collect nothing. The named export and the nested default are the same
     * singleton; whichever actually carries the methods is the provider.
     */
    const candidates = [
      imported.posthog,
      (imported as { default?: { default?: unknown } }).default?.default,
      imported.default,
    ];
    return candidates.find(isProvider) ?? null;
  } catch {
    return null;
  }
};

type State = {
  identity: AnalyticsIdentity | null;
  provider: Provider | null;
  /** In flight or settled initialization, so concurrent events do not race. */
  starting: Promise<Provider | null> | null;
};

const state: State = { identity: null, provider: null, starting: null };

let loader: Loader = loadPostHog;
let environment: NodeJS.ProcessEnv = process.env;

/** Test seam. Not used by product code. */
export function configureAnalyticsForTest(options: { loader?: Loader; env?: NodeJS.ProcessEnv } = {}) {
  loader = options.loader ?? loadPostHog;
  environment = options.env ?? process.env;
  state.identity = null;
  state.provider = null;
  state.starting = null;
}

/** True only when the environment allows analytics and consent is in effect. */
export function analyticsActive() {
  return state.identity !== null && analyticsEnvironmentAllowed(environment);
}

/**
 * The approved context attached to every event.
 *
 * Only canonical identifiers and the environment. No name, email,
 * organization name or organization domain is available to this module at all.
 */
function context(identity: AnalyticsIdentity) {
  return {
    user_id: identity.userId,
    organization_id: identity.organizationId,
    user_role: identity.userRole,
    environment: resolveEnvironment(environment),
  };
}

async function provider(): Promise<Provider | null> {
  if (state.provider) return state.provider;
  if (state.starting) return state.starting;

  const identity = state.identity;
  if (!identity) return null;
  const key = postHogProjectKey(environment);
  if (!key || !analyticsEnvironmentAllowed(environment)) return null;

  state.starting = (async () => {
    const loaded = await loader();
    if (!loaded) return null;
    try {
      loaded.init(key, postHogOptions());
      /*
       * The SDK is a singleton, so this instance may carry state from an
       * earlier session in the same browser. Reset first — which also returns
       * it to its configured opted-out default — then opt in, then identify.
       * That order is required: the SDK's reset() clears consent, so opting in
       * beforehand would be silently discarded, and it guarantees no previous
       * user's identity survives into this one.
       */
      loaded.reset();
      loaded.opt_in_capturing();
      // Pseudonymous identification, with approved context only.
      loaded.identify(identity.userId, context(identity));
    } catch {
      // A provider that cannot initialize simply yields no telemetry.
      return null;
    }
    state.provider = loaded;
    return loaded;
  })().catch(() => null);

  return state.starting;
}

/**
 * Turns analytics on for an authenticated user whose affirmative preference is
 * already persisted.
 *
 * Callers must not invoke this on the strength of a click: the preference has
 * to have been stored first. Initialization is lazy — the provider is loaded
 * when the first approved event is tracked — so enabling emits nothing by
 * itself and no historical activity is reconstructed.
 */
export function enable(identity: AnalyticsIdentity) {
  if (!analyticsEnvironmentAllowed(environment)) return;
  if (state.identity && state.identity.userId !== identity.userId) disable();
  state.identity = identity;
}

/**
 * Turns analytics off and clears the provider identity.
 *
 * Used for revocation and for sign-out, so a later user of the same browser
 * can never inherit the previous user's analytics identity.
 */
export function disable() {
  const current = state.provider;
  state.identity = null;
  state.provider = null;
  state.starting = null;
  try {
    // reset() clears the identity and returns the provider to its configured
    // default consent, which is opted out — so this fails closed. The explicit
    // opt-out follows rather than precedes it, because reset() would otherwise
    // discard it; see the SDK's own warning about ordering.
    current?.reset();
    current?.opt_out_capturing?.();
  } catch {
    // Resetting a broken provider must not break signing out.
  }
}

/**
 * Removes anything outside the approved vocabulary.
 *
 * Defence in depth: the typed event map already constrains callers, but types
 * do not survive a future careless edit and a privacy breach is not a
 * recoverable mistake.
 */
function approved(properties: Record<string, unknown>) {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (isProhibitedProperty(key)) continue;
    // Only scalars. An object or array could smuggle arbitrary text.
    if (value !== null && typeof value === "object") continue;
    safe[key] = value;
  }
  return safe;
}

/**
 * Emits one approved semantic event.
 *
 * A no-op unless analytics is active. Never throws, never returns a value the
 * caller is expected to handle, and never blocks the interaction it describes.
 */
export function track<Event extends AnalyticsEvent>(
  event: Event,
  properties: AnalyticsProperties[Event] = {} as AnalyticsProperties[Event],
) {
  const identity = state.identity;
  if (!identity || !analyticsEnvironmentAllowed(environment)) return;

  const payload = { ...approved(properties as Record<string, unknown>), ...context(identity) };
  void (async () => {
    try {
      const client = await provider();
      // The preference may have been revoked while the provider was loading.
      if (!client || !state.identity) return;
      client.capture(event, payload);
    } catch {
      // Analytics failure is never product failure.
    }
  })();
}
