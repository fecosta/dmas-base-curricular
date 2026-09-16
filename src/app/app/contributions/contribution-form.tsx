"use client";

import { useActionState } from "react";
import { saveContribution, type ContributionActionState } from "./actions";
import type { ContributionDetail, ContributionOption, ContributionOptions, ContributionType } from "@/lib/contributions/types";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

const initialState: ContributionActionState = {};

function value(detail: ContributionDetail | undefined, name: string) {
  const current = detail?.fields[name];
  return typeof current === "string" || typeof current === "number" ? String(current) : "";
}

function lines(detail: ContributionDetail | undefined, name: string) {
  const current = detail?.fields[name];
  return Array.isArray(current) ? current.join("\n") : "";
}

function OptionList({ options }: { options: ContributionOption[] }) {
  return options.map((option) => <option key={option.id} value={option.id}>
    {option.label}{option.state === "draft" ? " (borrador)" : option.state === "published_with_draft" ? " (nueva versión en borrador)" : ""}
  </option>);
}

function Multiple({ name, label, options, selected = [] }: { name: string; label: string; options: ContributionOption[]; selected?: string[] }) {
  return <Field label={label} hint="Puedes seleccionar más de una opción.">
    <select name={name} multiple defaultValue={selected} className="min-h-32"><OptionList options={options} /></select>
  </Field>;
}

export function ContributionForm({ type, options, detail, readOnly = false }: {
  type: ContributionType; options: ContributionOptions; detail?: ContributionDetail; readOnly?: boolean;
}) {
  const [state, action, pending] = useActionState(saveContribution, initialState);
  const relationships = detail?.relationships ?? {};

  return <form action={action} className="mt-8 space-y-7">
    <input type="hidden" name="content_type" value={type} />
    {detail && <input type="hidden" name="revision_id" value={detail.revisionId} />}
    {/* `disabled` on the fieldset is what makes published revisions read-only. */}
    <fieldset disabled={readOnly || pending} className="grid gap-6 md:grid-cols-2">
      {type === "module" && <>
        <Field label="Eje *">
          <select name="axis_id" required defaultValue={value(detail, "axis_id")}>
            <option value="">Selecciona un eje</option>
            {options.axes.map((axis) => <option key={axis.id} value={axis.id}>{axis.name}</option>)}
          </select>
        </Field>
        <Field label="Título *"><input name="title" required maxLength={240} defaultValue={value(detail, "title")} /></Field>
        <Field label="Tema"><input name="theme" maxLength={160} defaultValue={value(detail, "theme")} /></Field>
        <Field label="Duración sugerida"><input name="suggested_duration" maxLength={120} defaultValue={value(detail, "suggested_duration")} /></Field>
        <Field label="Descripción *" className="md:col-span-2"><textarea name="description" required defaultValue={value(detail, "description")} /></Field>
        <Field label="Resultados de aprendizaje" className="md:col-span-2" hint="Escribe un resultado por línea.">
          <textarea name="learning_outcomes" defaultValue={lines(detail, "learning_outcomes")} />
        </Field>
        <Multiple name="instructor_ids" label="Docentes o especialistas" options={options.instructors} selected={relationships.instructor_ids} />
        <Multiple name="material_ids" label="Materiales o estudios" options={options.materials} selected={relationships.material_ids} />
        <Multiple name="institution_ids" label="Instituciones" options={options.institutions} selected={relationships.institution_ids} />
      </>}
      {type === "program_topic" && <>
        <Field label="Módulo *">
          <select name="module_id" required defaultValue={value(detail, "module_id")}>
            <option value="">Selecciona un módulo</option><OptionList options={options.modules} />
          </select>
        </Field>
        <Field label="Posición"><input name="position" type="number" min="1" defaultValue={value(detail, "position")} /></Field>
        <Field label="Título *" className="md:col-span-2"><input name="title" required maxLength={240} defaultValue={value(detail, "title")} /></Field>
        <Field label="Descripción" className="md:col-span-2"><textarea name="description" defaultValue={value(detail, "description")} /></Field>
      </>}
      {type === "instructor" && <>
        <Field label="Nombre *"><input name="name" required maxLength={200} defaultValue={value(detail, "name")} /></Field>
        <Field label="Cargo o especialidad"><input name="role_or_title" maxLength={240} defaultValue={value(detail, "role_or_title")} /></Field>
        <Field label="Institución"><input name="institution" maxLength={240} defaultValue={value(detail, "institution")} /></Field>
        <Field label="País"><input name="country" maxLength={160} defaultValue={value(detail, "country")} /></Field>
        <Field label="Perfil" className="md:col-span-2"><textarea name="profile" defaultValue={value(detail, "profile")} /></Field>
        <Field label="LinkedIn (HTTPS)"><input name="linkedin_url" type="url" defaultValue={value(detail, "linkedin_url")} /></Field>
        <Field label="Ejes o temas" hint="Escribe un tema por línea.">
          <textarea name="thematic_axis_or_themes" defaultValue={lines(detail, "thematic_axis_or_themes")} />
        </Field>
      </>}
      {type === "teaching_note" && <>
        <Field label="Módulo *">
          <select name="module_id" required defaultValue={value(detail, "module_id")}>
            <option value="">Selecciona un módulo</option><OptionList options={options.modules} />
          </select>
        </Field>
        <Field label="Tema de programa">
          <select name="program_topic_id" defaultValue={value(detail, "program_topic_id")}>
            <option value="">Nota general del módulo</option><OptionList options={options.programTopics} />
          </select>
        </Field>
        <Field label="Título *" className="md:col-span-2"><input name="title" required maxLength={240} defaultValue={value(detail, "title")} /></Field>
        <Field label="Contenido" className="md:col-span-2" hint="Para publicar, incluye contenido, un enlace HTTPS o al menos un archivo.">
          <textarea name="text" defaultValue={value(detail, "text")} />
        </Field>
        <Field label="Enlace de fuente (HTTPS)"><input name="source_url" type="url" defaultValue={value(detail, "source_url")} /></Field>
        <Multiple name="material_ids" label="Materiales relacionados" options={options.materials} selected={relationships.material_ids} />
      </>}
      {type === "material" && <>
        <Field label="Título *"><input name="title" required maxLength={240} defaultValue={value(detail, "title")} /></Field>
        <Field label="Tipo de material *"><input name="material_type" required maxLength={120} placeholder="Informe, manual, curso…" defaultValue={value(detail, "material_type")} /></Field>
        <Field label="Descripción" className="md:col-span-2"><textarea name="description" defaultValue={value(detail, "description")} /></Field>
        <Field label="Fuente o institución"><input name="source_or_institution" maxLength={240} defaultValue={value(detail, "source_or_institution")} /></Field>
        <Field label="Enlace de fuente (HTTPS)"><input name="source_url" type="url" defaultValue={value(detail, "source_url")} /></Field>
        <Field label="País o alcance"><input name="country_or_scope" maxLength={160} defaultValue={value(detail, "country_or_scope")} /></Field>
        <Field label="Tema"><input name="theme" maxLength={160} defaultValue={value(detail, "theme")} /></Field>
      </>}
      {type === "institution" && <>
        <Field label="Nombre *"><input name="name" required maxLength={200} defaultValue={value(detail, "name")} /></Field>
        <Field label="Tipo de institución *"><input name="institution_type" required maxLength={120} defaultValue={value(detail, "institution_type")} /></Field>
        <Field label="País o alcance"><input name="country_or_scope" maxLength={160} defaultValue={value(detail, "country_or_scope")} /></Field>
        <Field label="Sitio web (HTTPS)"><input name="website_url" type="url" defaultValue={value(detail, "website_url")} /></Field>
        <Field label="Descripción" className="md:col-span-2"><textarea name="description" defaultValue={value(detail, "description")} /></Field>
        <Field label="Temas" className="md:col-span-2" hint="Escribe un tema por línea.">
          <textarea name="themes" defaultValue={lines(detail, "themes")} />
        </Field>
      </>}
    </fieldset>
    {state.error && <Notice tone="error">{state.error}</Notice>}
    {!readOnly && <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar borrador"}</Button>}
  </form>;
}
