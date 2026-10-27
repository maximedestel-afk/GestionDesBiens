-- Onglet DATA : "Bonus ECI", un pourcentage saisi manuellement — même
-- mécanique que Bonus FD. Valeur par défaut 50% : la colonne porte un
-- défaut (pour les biens créés à l'avenir, dont la ligne property_data
-- n'est créée qu'à la demande — voir updatePropertyDetailRow) et les
-- lignes existantes sont explicitement renseignées à 50%.

alter table property_data add column bonus_eci_percent numeric default 50;

update property_data set bonus_eci_percent = 50 where bonus_eci_percent is null;

insert into property_data (property_id)
select p.id
from properties p
where not exists (select 1 from property_data pd where pd.property_id = p.id);
