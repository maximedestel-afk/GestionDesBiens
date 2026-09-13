-- Ajoute la catégorie "Variable" au modèle de loyer (en plus de Fixe et Fixe + Variable).

alter table property_owner drop constraint if exists property_owner_rent_type_check;
alter table property_owner add constraint property_owner_rent_type_check
  check (rent_type is null or rent_type in ('fixe', 'variable', 'fixe_variable'));
