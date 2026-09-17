-- Commission (%) du propriétaire, en dessous du loyer — sans objet pour un
-- loyer fixe (l'interface grise le champ dans ce cas).

alter table property_owner
  add column commission_percent numeric;
