-- Détails appartement > Appartement : local poubelle (photo/vidéo/document,
-- lien, note).

alter table property_details add column if not exists trash_room_url text;
alter table property_details add column if not exists trash_room_notes text;

alter table attachments drop constraint if exists attachments_kind_check;
alter table attachments add constraint attachments_kind_check check (
  kind in (
    'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
    'lease_contract', 'visit_video', 'equipment_photo',
    'equipment_reference_photo', 'inventory_item_photo', 'element_photo',
    'key_set_photo', 'rib', 'rcp', 'wifi_pto_photo', 'trash_room'
  )
);
