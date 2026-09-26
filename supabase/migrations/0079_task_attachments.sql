-- Permet d'attacher des photos aux tâches (Planning / onglet Tâches) :
-- entity_type "task" et kind "task_photo" manquaient des contraintes
-- CHECK de la table attachments (ajoutées côté TypeScript sans migration
-- correspondante), ce qui faisait échouer tout ajout de photo sur une
-- tâche.

alter table attachments drop constraint if exists attachments_entity_type_check;
alter table attachments add constraint attachments_entity_type_check check (
  entity_type in ('property', 'equipment', 'inventory_item', 'property_element', 'property_key', 'task')
);

alter table attachments drop constraint if exists attachments_kind_check;
alter table attachments add constraint attachments_kind_check check (
  kind in (
    'access_video', 'wifi_contract', 'client_contract', 'edf_contract',
    'lease_contract', 'visit_video', 'equipment_photo',
    'equipment_reference_photo', 'inventory_item_photo', 'element_photo',
    'key_set_photo', 'rib', 'rcp', 'wifi_pto_photo', 'trash_room',
    'equipment_instruction_video', 'plan', 'key_photo', 'task_photo'
  )
);
