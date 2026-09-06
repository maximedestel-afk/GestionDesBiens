-- Gestion des clés : quand l'emplacement est "Boîte à clé", ajoute un champ
-- Emplacement (en plus du code), comme pour le Locker (adresse + code).

alter table property_keys add column if not exists box_location text;
