-- Détails appartement > Vidéo/photos d'accès : possibilité d'ajouter un lien
-- (URL) en plus des fichiers uploadés directement.

alter table property_details add column if not exists access_video_url text;
