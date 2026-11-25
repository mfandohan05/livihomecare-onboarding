alter table public.caregivers
  add column if not exists source text not null default 'onboarded'
  check (source in ('onboarded', 'imported'));
