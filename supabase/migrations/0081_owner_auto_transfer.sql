-- Case à cocher "Virement automatique configuré" (onglet Propriétaire,
-- avant le RIB) : indique si le virement automatique du loyer au
-- propriétaire a été mis en place.

alter table property_owner add column if not exists auto_transfer_set_up boolean;
