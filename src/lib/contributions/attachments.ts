const unsafeFilename = /[\u0000-\u001f\u007f"\\/]/;

export function safeAttachmentFilename(value: string) {
  const trimmed = value.trim();
  return trimmed && [...trimmed].length <= 255 && !unsafeFilename.test(trimmed) ? trimmed : null;
}
