create table if not exists public.trainings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  title text not null,
  description text not null default '',
  passing_score integer not null default 80 check (passing_score between 1 and 100),
  due_days integer check (due_days is null or due_days between 1 and 3650),
  roles text[] not null default '{}',
  is_published boolean not null default false,
  training_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trainings_company_idx on public.trainings (company_id, training_order);

create table if not exists public.training_slides (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings (id) on delete cascade,
  slide_order integer not null,
  title text,
  body text,
  image_path text,
  video_url text
);

create index if not exists training_slides_training_idx on public.training_slides (training_id, slide_order);

create table if not exists public.training_questions (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.trainings (id) on delete cascade,
  question_order integer not null,
  question_text text not null,
  options jsonb not null,
  correct_answer_index integer not null
);

create index if not exists training_questions_training_idx on public.training_questions (training_id, question_order);

create table if not exists public.caregiver_trainings (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.caregivers (id) on delete cascade,
  training_id uuid not null references public.trainings (id) on delete cascade,
  company_id uuid not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'passed')),
  current_slide integer not null default 0,
  attempts integer not null default 0,
  last_score integer,
  last_total integer,
  assigned_at timestamptz not null default now(),
  due_date timestamptz,
  completed_at timestamptz,
  marked_by_admin boolean not null default false,
  marked_by uuid,
  marked_by_name text,
  unique (caregiver_id, training_id)
);

create index if not exists caregiver_trainings_caregiver_idx on public.caregiver_trainings (caregiver_id);
create index if not exists caregiver_trainings_training_idx on public.caregiver_trainings (training_id);

alter table public.trainings enable row level security;
alter table public.training_slides enable row level security;
alter table public.training_questions enable row level security;
alter table public.caregiver_trainings enable row level security;
