-- Onglet "Accès" (admin) : zone de texte libre pour les infos techniques
-- (codes, mots de passe Supabase/GitHub, etc.), une seule ligne partagée.

create table app_notes (
  id text primary key default 'main',
  content text,
  updated_at timestamptz not null default now()
);

create trigger app_notes_set_updated_at
  before update on app_notes
  for each row execute function set_updated_at();

alter table app_notes enable row level security;

create policy "app_notes_admin_only" on app_notes
  for all to authenticated
  using (is_admin())
  with check (is_admin());

insert into app_notes (id, content) values ('main', null) on conflict (id) do nothing;
