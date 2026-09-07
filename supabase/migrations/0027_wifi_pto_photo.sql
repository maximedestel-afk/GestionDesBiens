-- Détails appartement > Wifi : photo de la prise optique et des branchements.

alter table attachments drop constraint if exists attachments_kind_check;
alter table attachments add constraint attachments_kind_check check (
  kind in (
    'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
    'lease_contract', 'visit_video', 'equipment_photo',
    'equipment_reference_photo', 'inventory_item_photo', 'element_photo',
    'key_set_photo', 'rib', 'rcp', 'wifi_pto_photo'
  )
);
