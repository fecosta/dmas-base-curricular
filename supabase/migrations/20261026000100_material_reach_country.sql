-- SPEC-013 / D-034: material reach (`country_or_scope`) on Draft revisions is
-- blank or one of the approved canonical Latin American country names. A value
-- that did not change is carried over unvalidated so legacy data stays usable.
-- No backfill, no row rewrite, no CHECK over existing rows, no new grants.

create function private.enforce_material_reach_country()
returns trigger
language plpgsql security invoker
set search_path = ''
as $$
declare
  approved constant text[] := array[
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
    'Ecuador', 'El Salvador', 'Guatemala', 'Haití', 'Honduras', 'México', 'Nicaragua',
    'Panamá', 'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela'
  ];
  predecessor_value text;
begin
  -- Only Draft rows and the Draft -> Published transition are validated. A row
  -- inserted directly as Published (owner/service-role fixtures and
  -- import_published_curriculum) is exempt; stored Published rows are immutable
  -- through the existing triggers.
  if not (new.status = 'Draft' or (tg_op = 'UPDATE' and old.status = 'Draft' and new.status = 'Published')) then
    return new;
  end if;
  -- Blank (NULL or whitespace-only) and approved canonical names are valid.
  if btrim(coalesce(new.country_or_scope, '')) = '' or new.country_or_scope = any (approved) then
    return new;
  end if;
  -- Off-list is valid only when unchanged.
  if tg_op = 'UPDATE' then
    if new.country_or_scope is not distinct from old.country_or_scope then
      return new;
    end if;
  else
    -- INSERT: carry-over from the same material's current published revision
    -- (the value create_successor_draft copies). A first revision has none.
    select predecessor.country_or_scope into predecessor_value
    from public.materials material
    join public.material_revisions predecessor on predecessor.id = material.current_published_revision_id
    where material.id = new.material_id and predecessor.status = 'Published';
    if found and new.country_or_scope is not distinct from predecessor_value then
      return new;
    end if;
  end if;

  raise exception 'material reach must be an approved country'
    using errcode = '23514',
      detail = 'country_or_scope is not blank, not on the approved reach list and not unchanged.',
      hint = 'material_reach_country';
end;
$$;

create trigger material_revisions_reach_country
before insert or update on public.material_revisions
for each row execute function private.enforce_material_reach_country();

revoke all on function private.enforce_material_reach_country()
from public, anon, authenticated, service_role;
