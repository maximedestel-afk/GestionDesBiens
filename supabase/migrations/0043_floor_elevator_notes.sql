-- Ajoute une note libre juste après Étage/Ascenseur dans l'onglet DE - Détails.

alter table property_details add column if not exists floor_elevator_notes text;
