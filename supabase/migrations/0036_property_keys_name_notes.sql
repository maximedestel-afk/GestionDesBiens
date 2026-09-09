-- Gestion des clés : nom renseigné à la création (plus de numérotation
-- automatique "Clé 1", "Clé 2"...) + zone de notes par clé.

alter table property_keys add column if not exists name text;
alter table property_keys add column if not exists notes text;
