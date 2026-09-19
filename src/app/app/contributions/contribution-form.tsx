"use client";

import { useActionState, useEffect, useRef } from "react";
import { saveContribution, type ContributionActionState } from "./actions";
import type { ContributionDetail, ContributionOption, ContributionOptions, ContributionType } from "@/lib/contributions/types";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { RelationshipPicker } from "./relationship-picker";
import { FormSection, WIDE_FIELD } from "./panels";

const initialState: ContributionActionState = {};

/**
 * What a control should start from: the values of the last rejected save when
 * there was one, and the stored revision otherwise.
 *
 * A rejected attempt is authoritative over the stored revision even where it is
 * empty — clearing a required field and being told so must not look as though
 * the field had never been touched.
 */
function value(state: ContributionActionState, detail: ContributionDetail | undefined, name: string) {
  if (state.submitted) return state.submitted[name]?.[0] ?? "";
  const current = detail?.fields[name];
  return typeof current === "string" || typeof current === "number" ? String(current) : "";
}

function lines(state: ContributionActionState, detail: ContributionDetail | undefined, name: string) {
  if (state.submitted) return state.submitted[name]?.[0] ?? "";
  const current = detail?.fields[name];
  return Array.isArray(current) ? current.join("\n") : "";
}

function OptionList({ options }: { options: ContributionOption[] }) {
  return options.map((option) => <option key={option.id} value={option.id}>
    {option.label}{option.state === "draft" ? " (borrador)" : option.state === "published_with_draft" ? " (nueva versión en borrador)" : ""}
  </option>);
}

function Multiple({ name, label, search, options, selected = [] }: {
  name: string; label: string; search: string; options: ContributionOption[]; selected?: string[];
}) {
  return <RelationshipPicker
    name={name}
    legend={label}
    searchLabel={search}
    options={options}
    selected={selected}
    hint="Puedes seleccionar más de una opción."
  />;
}

/**
 * The authoritative content form for every governed type.
 *
 * Phase 5 changes how the fields are grouped and how the form announces its
 * state. It does not change the contract: the same field names, the same
 * required fields, the same maximum lengths, the same relationship checkboxes
 * and the same `saveContribution` server action. Grouping is visual — one
 * <form>, one submit, one payload.
 */
export function ContributionForm({ type, options, detail, readOnly = false }: {
  type: ContributionType; options: ContributionOptions; detail?: ContributionDetail; readOnly?: boolean;
}) {
  const [state, action, pending] = useActionState(saveContribution, initialState);
  const actionsRef = useRef<HTMLDivElement>(null);
  const stored = detail?.relationships ?? {};
  /** Same rule as the fields: a rejected attempt wins, including when it selected nothing. */
  const relationships: Record<string, string[]> = state.submitted ?? stored;

  // The submit control is disabled while the action runs, so the browser drops
  // focus to the document; a rejected save would otherwise leave a keyboard user
  // back at the top of the page. role="alert" has already announced the failure,
  // so this only puts focus back where they left it, and never takes it from
  // somewhere they have since moved to.
  useEffect(() => {
    if (!state.error) return;
    if (document.activeElement === document.body) actionsRef.current?.querySelector("button")?.focus();
  }, [state]);

  return <form action={action} className="space-y-4">
    <input type="hidden" name="content_type" value={type} />
    {detail && <input type="hidden" name="revision_id" value={detail.revisionId} />}

    {/*
      Server validation is authoritative, so its message opens the form rather
      than hiding under it: Notice gives an error role="alert", which announces
      the failure without moving focus.

      React resets an uncontrolled `<form action={…}>` once its action returns,
      so surviving a rejected save is not automatic: the action hands back what
      was submitted, and the fieldset is keyed on the attempt so every control —
      including the relationship checkboxes, which are React-controlled and would
      otherwise be reset out of step with the selection shown — remounts onto
      those values rather than onto the form reset.
    */}
    {state.error && <Notice tone="error">{state.error}</Notice>}

    {readOnly && <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-hairline bg-inset px-5 py-4">
      <Badge tone="neutral">Solo lectura</Badge>
      <p className="min-w-0 text-body text-ink-soft">
        Esta versión está publicada. Para modificar su contenido, crea una nueva versión.
      </p>
    </div>}

    {/*
      `disabled` on this fieldset is what makes a published revision read-only,
      and it covers every nested control, including the relationship checkboxes.
      min-w-0 keeps the browser's default fieldset min-width from forcing the
      grid wider than a narrow viewport.
    */}
    <fieldset key={state.attempt ?? 0} disabled={readOnly || pending} className="min-w-0 space-y-4">
      {type === "module" && <>
        <FormSection step="01" title="Identificación" description="Cómo se reconoce este módulo en la biblioteca.">
          <Field label="Título *" className={WIDE_FIELD}><input name="title" required maxLength={240} defaultValue={value(state, detail, "title")} /></Field>
          <Field label="Tema"><input name="theme" maxLength={160} defaultValue={value(state, detail, "theme")} /></Field>
          <Field label="Duración sugerida"><input name="suggested_duration" maxLength={120} defaultValue={value(state, detail, "suggested_duration")} /></Field>
        </FormSection>
        <FormSection step="02" title="Clasificación curricular" description="El eje de la base curricular al que pertenece el módulo.">
          <Field label="Eje *" className={WIDE_FIELD}>
            <select name="axis_id" required defaultValue={value(state, detail, "axis_id")}>
              <option value="">Selecciona un eje</option>
              {options.axes.map((axis) => <option key={axis.id} value={axis.id}>{axis.name}</option>)}
            </select>
          </Field>
        </FormSection>
        <FormSection step="03" title="Descripción y resultados" columns={1} description="Qué cubre el módulo y qué se espera al terminarlo.">
          <Field label="Descripción *"><textarea name="description" required defaultValue={value(state, detail, "description")} /></Field>
          <Field label="Resultados de aprendizaje" hint="Escribe un resultado por línea.">
            <textarea name="learning_outcomes" defaultValue={lines(state, detail, "learning_outcomes")} />
          </Field>
        </FormSection>
        <FormSection step="04" title="Contenido relacionado" columns={1} description="Personas, materiales e instituciones que acompañan a este módulo.">
          <Multiple name="instructor_ids" label="Docentes o especialistas" search="Buscar docentes" options={options.instructors} selected={relationships.instructor_ids} />
          <Multiple name="material_ids" label="Materiales o estudios" search="Buscar materiales" options={options.materials} selected={relationships.material_ids} />
          <Multiple name="institution_ids" label="Instituciones" search="Buscar instituciones" options={options.institutions} selected={relationships.institution_ids} />
        </FormSection>
      </>}

      {type === "program_topic" && <>
        <FormSection step="01" title="Ubicación en el programa" description="El módulo al que pertenece el tema y su lugar dentro del programa.">
          <Field label="Módulo *">
            <select name="module_id" required defaultValue={value(state, detail, "module_id")}>
              <option value="">Selecciona un módulo</option><OptionList options={options.modules} />
            </select>
          </Field>
          <Field label="Posición" hint="Número entero. Determina el orden dentro del programa."><input name="position" type="number" min="1" defaultValue={value(state, detail, "position")} /></Field>
        </FormSection>
        <FormSection step="02" title="Contenido del tema" columns={1}>
          <Field label="Título *"><input name="title" required maxLength={240} defaultValue={value(state, detail, "title")} /></Field>
          <Field label="Descripción"><textarea name="description" defaultValue={value(state, detail, "description")} /></Field>
        </FormSection>
      </>}

      {type === "instructor" && <>
        <FormSection step="01" title="Identidad" columns={1}>
          <Field label="Nombre *"><input name="name" required maxLength={200} defaultValue={value(state, detail, "name")} /></Field>
        </FormSection>
        <FormSection step="02" title="Rol e institución" description="Cómo se presenta este perfil junto al conocimiento curricular.">
          <Field label="Cargo o especialidad"><input name="role_or_title" maxLength={240} defaultValue={value(state, detail, "role_or_title")} /></Field>
          <Field label="Institución"><input name="institution" maxLength={240} defaultValue={value(state, detail, "institution")} /></Field>
          <Field label="País"><input name="country" maxLength={160} defaultValue={value(state, detail, "country")} /></Field>
        </FormSection>
        <FormSection step="03" title="Perfil y temas" columns={1}>
          <Field label="Perfil"><textarea name="profile" defaultValue={value(state, detail, "profile")} /></Field>
          <Field label="LinkedIn (HTTPS)"><input name="linkedin_url" type="url" defaultValue={value(state, detail, "linkedin_url")} /></Field>
          <Field label="Ejes o temas" hint="Escribe un tema por línea.">
            <textarea name="thematic_axis_or_themes" defaultValue={lines(state, detail, "thematic_axis_or_themes")} />
          </Field>
        </FormSection>
      </>}

      {type === "teaching_note" && <>
        <FormSection step="01" title="Contexto curricular" description="El módulo, y opcionalmente el tema de programa, al que acompaña la nota.">
          <Field label="Módulo *">
            <select name="module_id" required defaultValue={value(state, detail, "module_id")}>
              <option value="">Selecciona un módulo</option><OptionList options={options.modules} />
            </select>
          </Field>
          <Field label="Tema de programa">
            <select name="program_topic_id" defaultValue={value(state, detail, "program_topic_id")}>
              <option value="">Nota general del módulo</option><OptionList options={options.programTopics} />
            </select>
          </Field>
        </FormSection>
        <FormSection step="02" title="Contenido de la nota" columns={1}>
          <Field label="Título *"><input name="title" required maxLength={240} defaultValue={value(state, detail, "title")} /></Field>
          <Field label="Contenido" hint="Para publicar, incluye contenido, un enlace HTTPS o al menos un archivo.">
            <textarea name="text" defaultValue={value(state, detail, "text")} />
          </Field>
          <Field label="Enlace de fuente (HTTPS)"><input name="source_url" type="url" defaultValue={value(state, detail, "source_url")} /></Field>
        </FormSection>
        <FormSection step="03" title="Materiales relacionados" columns={1}>
          <Multiple name="material_ids" label="Materiales relacionados" search="Buscar materiales" options={options.materials} selected={relationships.material_ids} />
        </FormSection>
      </>}

      {type === "material" && <>
        <FormSection step="01" title="Identificación">
          <Field label="Título *"><input name="title" required maxLength={240} defaultValue={value(state, detail, "title")} /></Field>
          <Field label="Tipo de material *"><input name="material_type" required maxLength={120} placeholder="Informe, manual, curso…" defaultValue={value(state, detail, "material_type")} /></Field>
        </FormSection>
        <FormSection step="02" title="Descripción y fuente" columns={1} description="De qué trata el material y de dónde proviene.">
          <Field label="Descripción"><textarea name="description" defaultValue={value(state, detail, "description")} /></Field>
          <Field label="Fuente o institución"><input name="source_or_institution" maxLength={240} defaultValue={value(state, detail, "source_or_institution")} /></Field>
          <Field label="Enlace de fuente (HTTPS)"><input name="source_url" type="url" defaultValue={value(state, detail, "source_url")} /></Field>
        </FormSection>
        <FormSection step="03" title="Alcance y tema" description="Cómo se encuentra este material en los filtros de la biblioteca.">
          <Field label="País o alcance"><input name="country_or_scope" maxLength={160} defaultValue={value(state, detail, "country_or_scope")} /></Field>
          <Field label="Tema"><input name="theme" maxLength={160} defaultValue={value(state, detail, "theme")} /></Field>
        </FormSection>
      </>}

      {type === "institution" && <>
        <FormSection step="01" title="Identificación">
          <Field label="Nombre *"><input name="name" required maxLength={200} defaultValue={value(state, detail, "name")} /></Field>
          <Field label="Tipo de institución *"><input name="institution_type" required maxLength={120} defaultValue={value(state, detail, "institution_type")} /></Field>
        </FormSection>
        <FormSection step="02" title="País y sitio">
          <Field label="País o alcance"><input name="country_or_scope" maxLength={160} defaultValue={value(state, detail, "country_or_scope")} /></Field>
          <Field label="Sitio web (HTTPS)"><input name="website_url" type="url" defaultValue={value(state, detail, "website_url")} /></Field>
        </FormSection>
        <FormSection step="03" title="Descripción y temas" columns={1}>
          <Field label="Descripción"><textarea name="description" defaultValue={value(state, detail, "description")} /></Field>
          <Field label="Temas" hint="Escribe un tema por línea.">
            <textarea name="themes" defaultValue={lines(state, detail, "themes")} />
          </Field>
        </FormSection>
      </>}
    </fieldset>

    {/*
      Saving is the form's own action and stays with the form. Publication and
      archival are lifecycle and governance actions and live in the rail beside
      it, so the three never read as three ways of doing the same thing.
    */}
    {!readOnly && <div ref={actionsRef} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-xl border border-hairline bg-surface px-5 py-4 shadow-card">
      <p className="min-w-0 text-body text-ink-muted">
        Se guarda como borrador. No será visible en la biblioteca hasta que se publique.
      </p>
      <Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar borrador"}</Button>
    </div>}
  </form>;
}
