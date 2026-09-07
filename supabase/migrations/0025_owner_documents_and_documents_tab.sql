-- Propriétaire : note pour Bail/RIB, nouveau document RCP, et possibilité
-- d'ajouter d'autres documents libres (titre + note). Nouvel onglet
-- "Documents" au niveau du bien, même mécanisme (titre + note + fichiers).

alter table property_owner add column if not exists lease_notes text;
alter table property_owner add column if not exists rib_notes text;
alter table property_owner add column if not exists rcp_notes text;

alter table property_elements drop constraint if exists property_elements_section_check;
alter table property_elements add constraint property_elements_section_check check (
  section in ('water_elec', 'notes', 'photos', 'cles', 'owner_documents', 'documents')
);

alter table attachments drop constraint if exists attachments_kind_check;
alter table attachments add constraint attachments_kind_check check (
  kind in (
    'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
    'lease_contract', 'visit_video', 'equipment_photo',
    'equipment_reference_photo', 'inventory_item_photo', 'element_photo',
    'key_set_photo', 'rib', 'rcp'
  )
);
