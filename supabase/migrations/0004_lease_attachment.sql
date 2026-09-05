-- Autorise le type de pièce jointe "lease_contract" (le bail),
-- rattaché à l'onglet Propriétaire.

alter table attachments drop constraint if exists attachments_kind_check;

alter table attachments add constraint attachments_kind_check check (
  kind in (
    'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
    'lease_contract', 'visit_video', 'equipment_photo',
    'equipment_reference_photo', 'inventory_item_photo'
  )
);
