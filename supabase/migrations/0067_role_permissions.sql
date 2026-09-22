-- Les onglets de bien et items du menu du haut autorisés se configurent
-- désormais par rôle (partagés par tous les utilisateurs de ce rôle), pas
-- par utilisateur individuel — remplace profiles.allowed_tabs pour cet
-- usage (la colonne reste en base mais n'est plus lue/écrite pour ça).

create table role_permissions (
  role text primary key,
  allowed_tabs text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create trigger role_permissions_set_updated_at
  before update on role_permissions
  for each row execute function set_updated_at();

alter table role_permissions enable row level security;

create policy "role_permissions_select_authenticated" on role_permissions
  for select to authenticated
  using (true);

create policy "role_permissions_write_admin" on role_permissions
  for all to authenticated
  using (is_admin())
  with check (is_admin());
