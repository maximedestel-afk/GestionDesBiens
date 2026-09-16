-- Modèle de bail ("bail type") : permet de le remplacer depuis l'app (menu
-- du haut, admin) plutôt que via le fichier statique embarqué dans le code.
-- Le fichier lui-même est stocké dans le bucket "property-files" à un
-- chemin fixe (une seule version active à la fois, remplacée à chaque
-- envoi) ; cette table ne garde que les métadonnées pour afficher quel
-- modèle est actuellement utilisé.

create table lease_template (
  id text primary key default 'main',
  file_path text,
  original_filename text,
  uploaded_by_email text,
  updated_at timestamptz not null default now()
);

create trigger lease_template_set_updated_at
  before update on lease_template
  for each row execute function set_updated_at();

alter table lease_template enable row level security;

create policy "lease_template_select_authenticated" on lease_template
  for select to authenticated
  using (true);

create policy "lease_template_insert_admin" on lease_template
  for insert to authenticated
  with check (is_admin());

create policy "lease_template_update_admin" on lease_template
  for update to authenticated
  using (is_admin())
  with check (is_admin());

insert into lease_template (id, file_path, original_filename) values ('main', null, null) on conflict (id) do nothing;
