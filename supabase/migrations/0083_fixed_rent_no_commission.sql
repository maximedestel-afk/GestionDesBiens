-- Un loyer "fixe" ne doit jamais porter de commission (le champ Commission
-- de l'onglet Propriétaire est grisé dès que le loyer est fixe) — nettoie
-- les valeurs restées en base d'avant un changement de modèle de loyer, ou
-- saisies via "Compléter en masse" (qui ne grisait pas le champ). Voir
-- aussi le code de savePropertyOwner/importProperties, qui impose
-- désormais la même règle côté serveur.

update property_owner set commission_percent = null where rent_type = 'fixe' and commission_percent is not null;
