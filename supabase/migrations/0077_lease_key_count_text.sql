-- Le champ "Nombre Clé Appart" doit accepter du texte libre (ex. "3 clés +
-- 1 badge"), pas seulement un nombre entier.

alter table property_owner alter column lease_key_count type text using lease_key_count::text;
