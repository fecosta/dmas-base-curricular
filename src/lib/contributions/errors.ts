type DatabaseError = { code?: string; message?: string };

export function publicationErrorMessage(error: DatabaseError) {
  const message = error.message ?? "";
  if (/active Admin Draft not found|Draft is not eligible/i.test(message)) return "Este borrador ya no está disponible para edición o publicación.";
  if (error.code === "42501") return "Tu permiso de administración cambió. Vuelve a ingresar antes de continuar.";
  if (/current-published|current published/i.test(message)) return "Publica primero los contenidos relacionados que necesita este borrador.";
  if (/attachment|source|valid for publication/i.test(message)) return "Completa la fuente o los archivos requeridos antes de publicar.";
  if (error.code === "40001") return "El contenido cambió mientras realizabas la acción. Actualiza la página e inténtalo nuevamente.";
  if (error.code === "23514") return "El borrador no cumple todavía todos los requisitos de publicación.";
  return "No pudimos publicar el contenido. Revisa los datos e inténtalo nuevamente.";
}
