/**
 * Feedback form URL configuration.
 *
 * The action is intentionally inert when the env var is missing or invalid.
 * Only absolute https: URLs are accepted so the link cannot be hijacked by
 * a relative, http: or javascript: value.
 */
export function getFeedbackFormUrl(env?: NodeJS.ProcessEnv): string | undefined {
  const raw = (env ? env.NEXT_PUBLIC_FEEDBACK_FORM_URL : process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL)?.trim();
  if (!raw) return undefined;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return undefined;
  }

  if (url.protocol !== "https:") return undefined;

  // Reject URLs with embedded credentials. They are not a legitimate form-URL
  // shape for this product surface and would leak the configured secret into
  // browser links / Referer.
  if (url.username || url.password) return undefined;

  return url.href;
}
