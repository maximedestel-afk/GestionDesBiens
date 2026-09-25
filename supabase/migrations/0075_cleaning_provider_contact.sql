-- Onglet DATA > Prestataire Ménage : coordonnées de contact (nom, prénom,
-- email, téléphone) sur cleaning_providers — table partagée entre tous les
-- biens, donc une modification sur un bien met à jour ces coordonnées
-- partout où ce prestataire est utilisé.

alter table cleaning_providers add column last_name text;
alter table cleaning_providers add column first_name text;
alter table cleaning_providers add column email text;
alter table cleaning_providers add column phone text;
