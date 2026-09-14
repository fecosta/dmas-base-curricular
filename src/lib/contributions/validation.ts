import type { Json } from "@/lib/supabase/database.types";
import type { ContributionType } from "@/lib/contributions/types";

export class ContributionValidationError extends Error {}

function text(form: FormData, name: string, maximum: number, required = false) {
  const value = String(form.get(name) ?? "").trim();
  if (required && !value) throw new ContributionValidationError("Completa los campos obligatorios.");
  if (value.length > maximum) throw new ContributionValidationError("Uno de los campos supera la extensión permitida.");
  return value || null;
}

function uuid(form: FormData, name: string, required = false) {
  const value = text(form, name, 36, required);
  if (value && !/^[0-9a-f-]{36}$/i.test(value)) throw new ContributionValidationError("Selecciona una opción válida.");
  return value;
}

function url(form: FormData, name: string) {
  const value = text(form, name, 2048);
  if (!value) return null;
  try {
    if (new URL(value).protocol !== "https:") throw new Error();
  } catch {
    throw new ContributionValidationError("Los enlaces deben ser direcciones HTTPS válidas.");
  }
  return value;
}

function lines(form: FormData, name: string) {
  return String(form.get(name) ?? "").split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 30);
}

function ids(form: FormData, name: string) {
  const values = form.getAll(name).map(String);
  if (values.some((value) => !/^[0-9a-f-]{36}$/i.test(value))) {
    throw new ContributionValidationError("Selecciona relaciones válidas.");
  }
  return [...new Set(values)];
}

export function contributionPayload(type: ContributionType, form: FormData): Json {
  switch (type) {
    case "module": return {
      axis_id: uuid(form, "axis_id", true), title: text(form, "title", 240, true),
      theme: text(form, "theme", 160), description: text(form, "description", 10_000, true),
      learning_outcomes: lines(form, "learning_outcomes"), suggested_duration: text(form, "suggested_duration", 120),
      instructor_ids: ids(form, "instructor_ids"), material_ids: ids(form, "material_ids"),
      institution_ids: ids(form, "institution_ids"),
    };
    case "program_topic": {
      const rawPosition = text(form, "position", 6);
      const position = rawPosition ? Number(rawPosition) : null;
      if (position !== null && (!Number.isInteger(position) || position < 1)) {
        throw new ContributionValidationError("La posición debe ser un número entero positivo.");
      }
      return { module_id: uuid(form, "module_id", true), title: text(form, "title", 240, true), description: text(form, "description", 10_000), position };
    }
    case "instructor": return {
      name: text(form, "name", 200, true), role_or_title: text(form, "role_or_title", 240),
      institution: text(form, "institution", 240), profile: text(form, "profile", 10_000), linkedin_url: url(form, "linkedin_url"),
      thematic_axis_or_themes: lines(form, "thematic_axis_or_themes"), country: text(form, "country", 160),
    };
    case "teaching_note": return {
      module_id: uuid(form, "module_id", true), program_topic_id: uuid(form, "program_topic_id"),
      title: text(form, "title", 240, true), text: text(form, "text", 20_000), source_url: url(form, "source_url"),
      material_ids: ids(form, "material_ids"),
    };
    case "material": return {
      title: text(form, "title", 240, true), material_type: text(form, "material_type", 120, true),
      description: text(form, "description", 10_000), source_or_institution: text(form, "source_or_institution", 240),
      source_url: url(form, "source_url"), country_or_scope: text(form, "country_or_scope", 160), theme: text(form, "theme", 160),
    };
    case "institution": return {
      name: text(form, "name", 200, true), institution_type: text(form, "institution_type", 120, true),
      country_or_scope: text(form, "country_or_scope", 160), description: text(form, "description", 10_000),
      website_url: url(form, "website_url"), themes: lines(form, "themes"),
    };
  }
}
