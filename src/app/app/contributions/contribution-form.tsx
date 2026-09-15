"use client";

import { useActionState } from "react";
import { saveContribution, type ContributionActionState } from "./actions";
import type { ContributionDetail, ContributionOption, ContributionOptions, ContributionType } from "@/lib/contributions/types";

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
  return <label><span className="filter-label">{label}</span>
    <select name={name} multiple defaultValue={selected} className="min-h-32"><OptionList options={options} /></select>
    <span className="mt-1 block text-xs text-slate-500">Puedes seleccionar más de una opción.</span>
  </label>;
}

export function ContributionForm({ type, options, detail, readOnly = false }: {
  type: ContributionType; options: ContributionOptions; detail?: ContributionDetail; readOnly?: boolean;
}) {
  const [state, action, pending] = useActionState(saveContribution, initialState);
  const relationships = detail?.relationships ?? {};
  return <form action={action} className="mt-8 space-y-7">
    <input type="hidden" name="content_type" value={type} />
    {detail && <input type="hidden" name="revision_id" value={detail.revisionId} />}
    <fieldset disabled={readOnly || pending} className="grid gap-6 md:grid-cols-2">
      {type === "module" && <>
        <label><span className="filter-label">Eje *</span><select name="axis_id" required defaultValue={value(detail, "axis_id")}><option value="">Selecciona un eje</option>{options.axes.map((axis) => <option key={axis.id} value={axis.id}>{axis.name}</option>)}</select></label>
        <label><span className="filter-label">Título *</span><input name="title" required maxLength={240} defaultValue={value(detail, "title")} /></label>
        <label><span className="filter-label">Tema</span><input name="theme" maxLength={160} defaultValue={value(detail, "theme")} /></label>
        <label><span className="filter-label">Duración sugerida</span><input name="suggested_duration" maxLength={120} defaultValue={value(detail, "suggested_duration")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Descripción *</span><textarea name="description" required defaultValue={value(detail, "description")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Resultados de aprendizaje</span><textarea name="learning_outcomes" defaultValue={lines(detail, "learning_outcomes")} /><span className="mt-1 block text-xs text-slate-500">Escribe un resultado por línea.</span></label>
        <Multiple name="instructor_ids" label="Docentes o especialistas" options={options.instructors} selected={relationships.instructor_ids} />
        <Multiple name="material_ids" label="Materiales o estudios" options={options.materials} selected={relationships.material_ids} />
        <Multiple name="institution_ids" label="Instituciones" options={options.institutions} selected={relationships.institution_ids} />
      </>}
      {type === "program_topic" && <>
        <label><span className="filter-label">Módulo *</span><select name="module_id" required defaultValue={value(detail, "module_id")}><option value="">Selecciona un módulo</option><OptionList options={options.modules} /></select></label>
        <label><span className="filter-label">Posición</span><input name="position" type="number" min="1" defaultValue={value(detail, "position")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Título *</span><input name="title" required maxLength={240} defaultValue={value(detail, "title")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Descripción</span><textarea name="description" defaultValue={value(detail, "description")} /></label>
      </>}
      {type === "instructor" && <>
        <label><span className="filter-label">Nombre *</span><input name="name" required maxLength={200} defaultValue={value(detail, "name")} /></label>
        <label><span className="filter-label">Cargo o especialidad</span><input name="role_or_title" maxLength={240} defaultValue={value(detail, "role_or_title")} /></label>
        <label><span className="filter-label">Institución</span><input name="institution" maxLength={240} defaultValue={value(detail, "institution")} /></label>
        <label><span className="filter-label">País</span><input name="country" maxLength={160} defaultValue={value(detail, "country")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Perfil</span><textarea name="profile" defaultValue={value(detail, "profile")} /></label>
        <label><span className="filter-label">LinkedIn (HTTPS)</span><input name="linkedin_url" type="url" defaultValue={value(detail, "linkedin_url")} /></label>
        <label><span className="filter-label">Ejes o temas</span><textarea name="thematic_axis_or_themes" defaultValue={lines(detail, "thematic_axis_or_themes")} /><span className="mt-1 block text-xs text-slate-500">Escribe un tema por línea.</span></label>
      </>}
      {type === "teaching_note" && <>
        <label><span className="filter-label">Módulo *</span><select name="module_id" required defaultValue={value(detail, "module_id")}><option value="">Selecciona un módulo</option><OptionList options={options.modules} /></select></label>
        <label><span className="filter-label">Tema de programa</span><select name="program_topic_id" defaultValue={value(detail, "program_topic_id")}><option value="">Nota general del módulo</option><OptionList options={options.programTopics} /></select></label>
        <label className="md:col-span-2"><span className="filter-label">Título *</span><input name="title" required maxLength={240} defaultValue={value(detail, "title")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Contenido</span><textarea name="text" defaultValue={value(detail, "text")} /><span className="mt-1 block text-xs text-slate-500">Para publicar, incluye contenido, un enlace HTTPS o al menos un archivo.</span></label>
        <label><span className="filter-label">Enlace de fuente (HTTPS)</span><input name="source_url" type="url" defaultValue={value(detail, "source_url")} /></label>
        <Multiple name="material_ids" label="Materiales relacionados" options={options.materials} selected={relationships.material_ids} />
      </>}
      {type === "material" && <>
        <label><span className="filter-label">Título *</span><input name="title" required maxLength={240} defaultValue={value(detail, "title")} /></label>
        <label><span className="filter-label">Tipo de material *</span><input name="material_type" required maxLength={120} placeholder="Informe, manual, curso…" defaultValue={value(detail, "material_type")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Descripción</span><textarea name="description" defaultValue={value(detail, "description")} /></label>
        <label><span className="filter-label">Fuente o institución</span><input name="source_or_institution" maxLength={240} defaultValue={value(detail, "source_or_institution")} /></label>
        <label><span className="filter-label">Enlace de fuente (HTTPS)</span><input name="source_url" type="url" defaultValue={value(detail, "source_url")} /></label>
        <label><span className="filter-label">País o alcance</span><input name="country_or_scope" maxLength={160} defaultValue={value(detail, "country_or_scope")} /></label>
        <label><span className="filter-label">Tema</span><input name="theme" maxLength={160} defaultValue={value(detail, "theme")} /></label>
      </>}
      {type === "institution" && <>
        <label><span className="filter-label">Nombre *</span><input name="name" required maxLength={200} defaultValue={value(detail, "name")} /></label>
        <label><span className="filter-label">Tipo de institución *</span><input name="institution_type" required maxLength={120} defaultValue={value(detail, "institution_type")} /></label>
        <label><span className="filter-label">País o alcance</span><input name="country_or_scope" maxLength={160} defaultValue={value(detail, "country_or_scope")} /></label>
        <label><span className="filter-label">Sitio web (HTTPS)</span><input name="website_url" type="url" defaultValue={value(detail, "website_url")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Descripción</span><textarea name="description" defaultValue={value(detail, "description")} /></label>
        <label className="md:col-span-2"><span className="filter-label">Temas</span><textarea name="themes" defaultValue={lines(detail, "themes")} /><span className="mt-1 block text-xs text-slate-500">Escribe un tema por línea.</span></label>
      </>}
    </fieldset>
    {state.error && <p role="alert" className="rounded-md bg-red-50 p-4 font-semibold text-red-800">{state.error}</p>}
    {!readOnly && <button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar borrador"}</button>}
  </form>;
}
