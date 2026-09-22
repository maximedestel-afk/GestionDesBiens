-- Nouvel onglet "Défauts" (après Eau/Élec) : liste d'éléments avec photo ou
-- vidéo et une note, même mécanisme que les onglets Notes/Documents.

alter table property_elements drop constraint if exists property_elements_section_check;
alter table property_elements add constraint property_elements_section_check check (
  section in ('water_elec', 'notes', 'photos', 'cles', 'owner_documents', 'documents', 'defauts')
);
