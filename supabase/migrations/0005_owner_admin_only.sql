-- Restreint l'onglet Propriétaire (coordonnées + bail) aux comptes admin.
-- Les comptes "ménage" n'ont plus accès à ces données, y compris au
-- niveau base de données (pas seulement caché dans l'interface).

drop policy if exists "property_owner_all_authenticated" on property_owner;

create policy "property_owner_admin_only" on property_owner
  for all to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "attachments_all_authenticated" on attachments;

create policy "attachments_select_authenticated" on attachments
  for select to authenticated
  using (
    kind <> 'lease_contract'
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "attachments_insert_authenticated" on attachments
  for insert to authenticated
  with check (
    kind <> 'lease_contract'
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "attachments_update_authenticated" on attachments
  for update to authenticated
  using (
    kind <> 'lease_contract'
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    kind <> 'lease_contract'
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "attachments_delete_authenticated" on attachments
  for delete to authenticated
  using (
    kind <> 'lease_contract'
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
