-- Page "Accès" : plusieurs documents (instructions d'utilisation de divers
-- programmes, etc.), chacun avec un titre et un fichier joint — en plus de
-- la zone de notes libre déjà existante.

create table app_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_path text not null,
  original_filename text not null,
  mime_type text,
  size_bytes bigint,
  position integer not null default 0,
  uploaded_by_email text,
  created_at timestamptz not null default now()
);

alter table app_documents enable row level security;

create policy "app_documents_select_authenticated" on app_documents
  for select to authenticated
  using (true);

create policy "app_documents_insert_admin" on app_documents
  for insert to authenticated
  with check (is_admin());

create policy "app_documents_delete_admin" on app_documents
  for delete to authenticated
  using (is_admin());
