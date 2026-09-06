-- Ajout : Détails appartement > Clé/Serrure (type de serrure : Clé ou
-- Connectée) + contenu du trousseau de clé (Clé / Clé+Vigik / renseigné
-- manuellement) avec une photo du trousseau.

alter table property_details add column if not exists lock_type text check (lock_type in ('cle', 'connectee'));
alter table property_details add column if not exists key_content_type text check (key_content_type in ('cle', 'cle_vigik', 'autre'));
alter table property_details add column if not exists key_content_detail text;

alter table attachments drop constraint if exists attachments_kind_check;
alter table attachments add constraint attachments_kind_check check (
  kind in (
    'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
    'lease_contract', 'visit_video', 'equipment_photo',
    'equipment_reference_photo', 'inventory_item_photo', 'element_photo',
    'key_set_photo'
  )
);
