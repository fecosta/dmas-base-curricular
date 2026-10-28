import { getFeedbackFormUrl } from "@/lib/feedback/config";
import { cn } from "@/components/ui/cn";

const MESSAGE_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
    className="size-5"
  >
    <path
      fillRule="evenodd"
      d="M2 10c0-3.771 0-5.657 1.172-6.828C4.343 2 6.229 2 10 2s5.657 0 6.828 1.172C18 4.343 18 6.229 18 10s0 5.657-1.172 6.828C15.657 18 13.771 18 10 18c-.853 0-1.642-.002-2.363-.056L4.576 19.96c-.462.295-.989-.19-.762-.698l1.14-2.468C3.013 15.55 2 14.15 2 12.028V10Zm5-2a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H7Zm0 4a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2H7Z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * Floating feedback action for the authenticated shell.
 *
 * Renders nothing when the configured URL is missing or invalid, so the action
 * stays inert until an approved https: form URL is supplied.
 *
 * The label is always available to assistive technology; on narrow viewports it
 * is visually hidden so the button stays compact. The title attribute supplies
 * the tooltip text on mouse hover and is exposed to assistive technology as the
 * description; the accessible name comes from aria-label and the visible text.
 */
export function FeedbackLink() {
  const url = getFeedbackFormUrl();
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Enviar comentarios"
      title="Ayúdanos a mejorar la plataforma"
      className={cn(
        "fixed z-40 inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-surface px-4 py-3 text-control font-bold text-primary shadow-panel transition-colors hover:bg-inset hover:text-primary-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        // Offset is on position rather than padding so the button stays
        // symmetric. env(safe-area-*) falls back to 0 because the root viewport
        // does not set viewport-fit=cover; it is kept as a harmless future-proof
        // reserve.
        "bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))]",
      )}
    >
      {MESSAGE_ICON}
      <span className="hidden sm:inline">Enviar comentarios</span>
    </a>
  );
}
