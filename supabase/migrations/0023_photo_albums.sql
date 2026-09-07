-- Nouvel onglet Photos : albums (ex. "Photos brut 19/05", "Photos IA"),
-- chacun avec un titre, plusieurs photos jointes (comme les autres galeries)
-- et/ou un lien externe (ex. album Google Photos).

alter table property_elements add column if not exists url text;

alter table property_elements drop constraint if exists property_elements_section_check;
alter table property_elements add constraint property_elements_section_check check (
  section in ('water_elec', 'notes', 'photos')
);
