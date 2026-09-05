-- Bucket de stockage pour les photos, vidéos et contrats des biens.
-- Bucket privé : l'accès aux fichiers passe par des URLs signées générées
-- côté serveur pour les utilisateurs authentifiés.

insert into storage.buckets (id, name, public)
values ('property-files', 'property-files', false)
on conflict (id) do nothing;

create policy "property_files_select_authenticated"
  on storage.objects for select to authenticated
  using (bucket_id = 'property-files');

create policy "property_files_insert_authenticated"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'property-files');

create policy "property_files_update_authenticated"
  on storage.objects for update to authenticated
  using (bucket_id = 'property-files')
  with check (bucket_id = 'property-files');

create policy "property_files_delete_authenticated"
  on storage.objects for delete to authenticated
  using (bucket_id = 'property-files');
