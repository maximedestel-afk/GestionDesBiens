-- Onglet Propriétaire : ajout du RIB (fichiers), protégé comme le bail
-- (accès réservé aux admins).

alter table attachments drop constraint if exists attachments_kind_check;
alter table attachments add constraint attachments_kind_check check (
  kind in (
    'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
    'lease_contract', 'visit_video', 'equipment_photo',
    'equipment_reference_photo', 'inventory_item_photo', 'element_photo',
    'key_set_photo', 'rib'
  )
);

drop policy if exists "attachments_select_authenticated" on attachments;
create policy "attachments_select_authenticated" on attachments
  for select to authenticated
  using (kind not in ('lease_contract', 'rib') or is_admin());

drop policy if exists "attachments_insert_authenticated" on attachments;
create policy "attachments_insert_authenticated" on attachments
  for insert to authenticated
  with check (kind not in ('lease_contract', 'rib') or is_admin());

drop policy if exists "attachments_update_authenticated" on attachments;
create policy "attachments_update_authenticated" on attachments
  for update to authenticated
  using (kind not in ('lease_contract', 'rib') or is_admin())
  with check (kind not in ('lease_contract', 'rib') or is_admin());

drop policy if exists "attachments_delete_authenticated" on attachments;
create policy "attachments_delete_authenticated" on attachments
  for delete to authenticated
  using (kind not in ('lease_contract', 'rib') or is_admin());
