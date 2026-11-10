-- ════════════════════════════════════════════════════════════════════
-- PROJECT · Migración inicial
-- Principios:
--   · Minimización de datos: sin nombre, sin DNI, sin fecha de nacimiento,
--     sin ubicación exacta. Edad por rango y zona aproximada.
--   · Catálogo académico solo con datos verificados (fuente + fecha).
--   · Cada evaluación guarda la versión de metodología y de cada pregunta.
--   · RLS activado en TODAS las tablas. El cliente nunca usa service_role.
-- ════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ─────────────── Tipos ───────────────
create type verification_status as enum ('pendiente', 'verificado', 'desactualizado', 'descartado');
create type institution_kind    as enum ('universidad', 'instituto_universitario', 'instituto_terciario', 'otro');
create type institution_sector  as enum ('publica', 'privada');
create type program_level       as enum ('grado', 'pregrado', 'tecnicatura', 'terciario', 'profesorado', 'ciclo');
create type study_modality      as enum ('presencial', 'virtual', 'mixta');
create type assessment_status   as enum ('en_curso', 'finalizada', 'abandonada');
create type app_role            as enum ('estudiante', 'editor', 'admin');

-- ─────────────── Usuarios ───────────────
-- auth.users lo gestiona Supabase Auth. Acá solo datos mínimos de la app.
create table public.users (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          app_role not null default 'estudiante',
  age_band      text check (age_band in ('15','16','17','18','otra')),
  school_year   text,
  zone          text check (zone in ('caba','gba_norte','gba_oeste','gba_sur','otra')),
  consent_version text not null,          -- versión del texto de consentimiento aceptado
  consent_at    timestamptz not null default now(),
  guardian_ack  boolean not null default false, -- aviso a adulto responsable (ver docs/PRIVACY.md)
  created_at    timestamptz not null default now()
);

-- ─────────────── Metodología versionada ───────────────
create table public.methodology_versions (
  version      text primary key,               -- ej. '0.1.0-draft'
  status       text not null check (status in ('borrador','en_revision','aprobada','retirada')),
  notes        text,
  reviewed_by  text,                            -- profesionales que la revisaron
  created_at   timestamptz not null default now()
);

create table public.questions (
  id          text primary key,                 -- ej. 'op-horas'
  dimension   text not null,
  kind        text not null check (kind in ('opening','core','deep','probe')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.question_versions (
  question_id text not null references public.questions(id),
  version     int  not null,
  methodology_version text not null references public.methodology_versions(version),
  format      text not null,
  definition  jsonb not null,                   -- prompt, opciones y señales (pesos)
  created_at  timestamptz not null default now(),
  primary key (question_id, version)
);

-- ─────────────── Evaluaciones ───────────────
create table public.assessments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade, -- null = visitante (no se persiste por defecto)
  methodology_version text not null references public.methodology_versions(version),
  status        assessment_status not null default 'en_curso',
  onboarding    jsonb not null,                 -- rango de edad, año, zona, áreas, consentimiento IA
  ai_consent    boolean not null default false,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  expires_at    timestamptz                     -- retención (ver política)
);
create index on public.assessments (user_id);

create table public.responses (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  position      int  not null,
  question_id   text not null,                  -- puede ser 'gen-n' (pregunta generada)
  question_version int not null,
  generated_definition jsonb,                   -- si fue generada por IA, su texto exacto
  answer        jsonb not null,
  derived       jsonb,                          -- señales extraídas por IA (recalculadas en servidor)
  created_at    timestamptz not null default now(),
  unique (assessment_id, position)
);

create table public.profiles (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  coverage      jsonb not null,
  context       jsonb not null,
  tensions      text[] not null default '{}',
  created_at    timestamptz not null default now()
);

create table public.profile_dimensions (
  assessment_id uuid not null references public.profiles(assessment_id) on delete cascade,
  facet         text not null,
  dimension     text not null,
  score         numeric(5,4) not null,
  confidence    numeric(5,4) not null,
  evidence      jsonb not null,                 -- [{itemId, delta, answerLabel}]
  primary key (assessment_id, facet)
);

-- ─────────────── Catálogo académico (solo datos verificados) ───────────────
create table public.sources (
  id           uuid primary key default gen_random_uuid(),
  url          text not null,
  title        text,
  publisher    text,                            -- ej. institución o Ministerio
  retrieved_at timestamptz not null,
  snapshot_path text                            -- copia archivada (Storage), opcional
);

create table public.study_fields (               -- áreas metodológicas (no datos institucionales)
  id        text primary key,
  name      text not null,
  summary   text not null,
  profile   jsonb not null,                     -- pesos por faceta
  methodology_version text not null references public.methodology_versions(version)
);

create table public.institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  short_name  text,
  kind        institution_kind not null,
  sector      institution_sector not null,
  website     text,
  source_id   uuid references public.sources(id),
  status      verification_status not null default 'pendiente',
  verified_at timestamptz,
  created_at  timestamptz not null default now()
);

create table public.campuses (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name           text not null,
  locality       text,                          -- localidad / partido
  zone           text check (zone in ('caba','gba_norte','gba_oeste','gba_sur','otra')),
  address        text,
  source_id      uuid references public.sources(id),
  status         verification_status not null default 'pendiente',
  verified_at    timestamptz
);

-- Carrera "conceptual" (ej. Licenciatura en Psicología) independiente de dónde se dicta.
create table public.careers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  knowledge_area text not null,
  field_id      text references public.study_fields(id),
  description   text,
  career_outcomes text[],
  status        verification_status not null default 'pendiente',
  created_at    timestamptz not null default now()
);

create table public.career_attributes (
  career_id uuid not null references public.careers(id) on delete cascade,
  facet     text not null,
  weight    numeric(4,3) not null check (weight between -1 and 1),
  primary key (career_id, facet)
);

-- Oferta concreta: una carrera en una institución (N:M entre careers e institutions).
create table public.programs (
  id               uuid primary key default gen_random_uuid(),
  career_id        uuid not null references public.careers(id) on delete cascade,
  institution_id   uuid not null references public.institutions(id) on delete cascade,
  official_name    text not null,
  level            program_level not null,
  degree_title     text,                         -- título otorgado
  duration_text    text,                         -- tal como lo publica la institución
  duration_years   numeric(3,1),
  admission        text,                         -- requisitos de ingreso
  fees_info        text,                         -- aranceles (texto + fecha, cambian seguido)
  scholarships     text,
  orientations     text[],
  source_id        uuid not null references public.sources(id),
  status           verification_status not null default 'pendiente',
  verified_at      timestamptz,
  unique (institution_id, official_name)
);

-- Una oferta puede dictarse en varias sedes y con distinta modalidad en cada una.
create table public.program_campuses (
  program_id uuid not null references public.programs(id) on delete cascade,
  campus_id  uuid not null references public.campuses(id) on delete cascade,
  modality   study_modality not null,
  shifts     text[],                            -- turnos, si se publican
  source_id  uuid references public.sources(id),
  primary key (program_id, campus_id, modality)
);

create table public.study_plans (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references public.programs(id) on delete cascade,
  plan_code   text,                             -- ej. resolución / año del plan
  subjects    jsonb not null,                   -- [{name, year, term}]
  source_id   uuid not null references public.sources(id),
  verified_at timestamptz
);

-- ─────────────── Recomendaciones ───────────────
create table public.recommendations (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  field_id      text not null references public.study_fields(id),
  career_id     uuid references public.careers(id),
  kind          text not null check (kind in ('principal','descubrimiento')),
  level         text not null,                  -- nivel cualitativo, nunca porcentaje
  personal      numeric(5,4) not null,
  academic      numeric(5,4) not null,
  rank          int not null,
  created_at    timestamptz not null default now()
);

create table public.recommendation_reasons (
  id                uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations(id) on delete cascade,
  type   text not null check (type in ('razon','respaldo','no_encaja','falta_explorar','relacionada')),
  facet  text,
  text   text not null,
  response_question_id text                     -- trazabilidad a la respuesta que lo respalda
);

-- ─────────────── Espacio personal ───────────────
create table public.saved_careers (
  user_id    uuid not null references public.users(id) on delete cascade,
  career_id  uuid references public.careers(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  field_id   text references public.study_fields(id),
  created_at timestamptz not null default now(),
  check (num_nonnulls(career_id, program_id, field_id) = 1)
);
create unique index saved_unique on public.saved_careers (user_id, coalesce(career_id::text, program_id::text, field_id));

create table public.comparisons (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  program_ids uuid[] not null check (array_length(program_ids, 1) between 2 and 4),
  created_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════
-- RLS
-- ════════════════════════════════════════════════════════════════════
create or replace function public.has_role(r app_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.users u where u.id = auth.uid() and u.role = r);
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'users','methodology_versions','questions','question_versions','assessments','responses',
    'profiles','profile_dimensions','sources','study_fields','institutions','campuses','careers',
    'career_attributes','programs','program_campuses','study_plans','recommendations',
    'recommendation_reasons','saved_careers','comparisons'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Datos propios del estudiante
create policy "own user row" on public.users
  for all using (id = auth.uid()) with check (id = auth.uid() and role = 'estudiante');

create policy "own assessments" on public.assessments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own responses" on public.responses
  for all using (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()))
  with check (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()));

create policy "own profiles" on public.profiles
  for select using (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()));
create policy "own profile dims" on public.profile_dimensions
  for select using (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()));
create policy "own recommendations" on public.recommendations
  for select using (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()));
create policy "own reasons" on public.recommendation_reasons
  for select using (exists (
    select 1 from public.recommendations r join public.assessments a on a.id = r.assessment_id
    where r.id = recommendation_id and a.user_id = auth.uid()));

create policy "own saved" on public.saved_careers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own comparisons" on public.comparisons
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Catálogo: lectura pública SOLO de lo verificado; escritura solo editores/admins.
create policy "public read verified institutions" on public.institutions for select using (status = 'verificado');
create policy "public read verified campuses"     on public.campuses     for select using (status = 'verificado');
create policy "public read verified careers"      on public.careers      for select using (status = 'verificado');
create policy "public read verified programs"     on public.programs     for select using (status = 'verificado');
create policy "public read career attrs"   on public.career_attributes for select using (true);
create policy "public read program campuses" on public.program_campuses for select using (true);
create policy "public read study plans"    on public.study_plans for select using (true);
create policy "public read sources"        on public.sources     for select using (true);
create policy "public read fields"         on public.study_fields for select using (true);
create policy "public read questions"      on public.questions for select using (is_active);
create policy "public read question versions" on public.question_versions for select using (true);
create policy "public read methodology"    on public.methodology_versions for select using (true);

do $$
declare t text;
begin
  foreach t in array array[
    'sources','study_fields','institutions','campuses','careers','career_attributes','programs',
    'program_campuses','study_plans','questions','question_versions','methodology_versions'
  ] loop
    execute format(
      'create policy "editors write %1$s" on public.%1$I for all using (public.has_role(''editor'') or public.has_role(''admin'')) with check (public.has_role(''editor'') or public.has_role(''admin''))', t);
  end loop;
end $$;

-- Retención: evaluaciones sin cuenta o vencidas se eliminan (job programado con pg_cron).
-- select cron.schedule('purge-expired', '0 4 * * *', $$delete from public.assessments where expires_at < now()$$);

insert into public.methodology_versions (version, status, notes)
values ('0.1.0-draft', 'borrador', 'Primera versión interna. Pendiente de revisión profesional.');
