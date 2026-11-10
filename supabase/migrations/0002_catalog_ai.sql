-- ════════════════════════════════════════════════════════════════════
-- PROJECT · 0002 — Catálogo normalizado + trazabilidad de IA + borrado de datos
-- ════════════════════════════════════════════════════════════════════

-- ─────────────── Unidades académicas (no confundir con institución ni sede) ───────────────
create type unit_kind as enum ('facultad', 'facultad_regional', 'escuela', 'departamento', 'instituto', 'area', 'listado');

create table public.academic_units (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null,                 -- tal como lo publica la fuente
  kind           unit_kind not null,            -- 'area'/'listado' cuando el sitio no habla de facultades
  source_id      uuid references public.sources(id),
  unique (institution_id, name)
);

-- Una oferta puede figurar en más de una unidad (p. ej. UP lista carreras en dos facultades).
create table public.program_units (
  program_id uuid not null references public.programs(id) on delete cascade,
  unit_id    uuid not null references public.academic_units(id) on delete cascade,
  primary key (program_id, unit_id)
);

-- Estado por campo: qué está verificado y qué no (duración, título, sedes, etc.).
alter table public.programs
  add column institution_slug text,            -- id estable del catálogo (ej. 'uba')
  add column level_inferred text,              -- clasificación editorial a partir del nombre oficial
  add column field_ids text[] not null default '{}',
  add column pending_fields text[] not null default '{}',
  add column start_note text,
  -- Los ciclos de complementación (requieren título previo) no se agrupan en una carrera.
  alter column career_id drop not null;
alter type program_level add value if not exists 'programa_conjunto';

-- Carrera = agrupación editorial de ofertas equivalentes entre instituciones.
alter table public.careers
  add column career_key text unique,
  add column field_ids text[] not null default '{}';

alter table public.institutions
  add column slug text unique,
  add column notes text[] not null default '{}';

alter table public.campuses
  add column role text check (role in ('sede', 'rectorado', 'posgrado', 'futura'));

-- Versión del catálogo con la que se generó cada informe.
create table public.catalog_versions (
  version    text primary key,                  -- ej. '2026-11-10'
  notes      text,
  created_at timestamptz not null default now()
);

-- ─────────────── Trazabilidad de IA ───────────────
alter table public.assessments
  add column catalog_version text references public.catalog_versions(version),
  add column engine jsonb;                      -- { mode, note, trace: [{task, model, promptVersion, ok}] }

alter table public.profiles
  add column exploratory jsonb;                 -- perfil exploratorio interpretado por IA

alter table public.recommendations
  add column career_key text,
  add column why text,
  alter column field_id drop not null,
  drop column personal,
  drop column academic;

alter table public.recommendation_reasons drop constraint recommendation_reasons_type_check;
alter table public.recommendation_reasons add constraint recommendation_reasons_type_check
  check (type in ('razon','respaldo','actividad','no_encaja','falta_explorar','relacionada'));

-- ─────────────── RLS de tablas nuevas ───────────────
alter table public.academic_units enable row level security;
alter table public.program_units enable row level security;
alter table public.catalog_versions enable row level security;

create policy "public read units" on public.academic_units for select using (true);
create policy "public read program units" on public.program_units for select using (true);
create policy "public read catalog versions" on public.catalog_versions for select using (true);
create policy "editors write units" on public.academic_units for all
  using (public.has_role('editor') or public.has_role('admin')) with check (public.has_role('editor') or public.has_role('admin'));
create policy "editors write program units" on public.program_units for all
  using (public.has_role('editor') or public.has_role('admin')) with check (public.has_role('editor') or public.has_role('admin'));
create policy "editors write catalog versions" on public.catalog_versions for all
  using (public.has_role('editor') or public.has_role('admin')) with check (public.has_role('editor') or public.has_role('admin'));

-- ─────────────── Eliminación de datos a pedido del usuario ───────────────
-- Borra todo lo del usuario autenticado (evaluaciones, respuestas, perfiles,
-- recomendaciones, guardados) por cascada. La baja de auth.users la completa
-- una función de servidor con privilegios (pendiente, ver docs/PRIVACY.md).
create or replace function public.delete_my_data() returns void
language sql security definer set search_path = public as $$
  delete from public.users where id = auth.uid();
$$;
revoke all on function public.delete_my_data() from public;
grant execute on function public.delete_my_data() to authenticated;

insert into public.methodology_versions (version, status, notes)
values ('0.2.0', 'aprobada', 'Metodología exploratoria asistida por IA. Sin validación psicométrica. Revisión profesional opcional a futuro.');
insert into public.catalog_versions (version, notes)
values ('2026-11-10', 'Primera tanda: 11 instituciones prioritarias.');
