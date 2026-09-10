-- Simplifie les tâches : plus de rattachement à un onglet/section précis,
-- juste le bien concerné (choisi automatiquement si on ajoute la tâche
-- depuis la fiche du bien, ou à choisir explicitement depuis l'écran
-- d'accueil).
alter table tasks drop column if exists tab_key;
alter table tasks drop column if exists section;
