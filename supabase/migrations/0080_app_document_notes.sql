-- Note de texte libre sur un document de la page Accès (ex. précisions
-- d'utilisation en plus du fichier lui-même).

alter table app_documents add column if not exists notes text;
