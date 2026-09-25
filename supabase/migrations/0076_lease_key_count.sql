-- Onglet Bail : nombre de clés de l'appartement remises au locataire,
-- à côté du champ existant "Contenu du trousseau de clé" (clés_appart
-- dans le modèle de bail).

alter table property_owner add column lease_key_count integer;
