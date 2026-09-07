-- Onglet Clés/Serrure : éléments génériques (Carte clé, Bridge Tedee,
-- interphone, etc.), chacun avec une photo et une note, comme pour les
-- éléments Eau/Élec et Notes. Ajoute aussi une note pour le trousseau.

alter table property_elements drop constraint if exists property_elements_section_check;
alter table property_elements add constraint property_elements_section_check check (
  section in ('water_elec', 'notes', 'photos', 'cles')
);

alter table property_details add column if not exists key_set_note text;
