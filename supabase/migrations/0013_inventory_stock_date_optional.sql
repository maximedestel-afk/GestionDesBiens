-- Inventaire : la date de saisie ne doit apparaître que si la quantité en
-- stock a réellement été renseignée par quelqu'un (pas à la simple création
-- de l'article, ex. chargement de la liste standard).

alter table inventory_items alter column stock_updated_at drop not null;
alter table inventory_items alter column stock_updated_at drop default;

-- Les lignes existantes n'ont pas de vraie date de saisie tant que la
-- quantité n'a pas été modifiée manuellement : on efface la date par défaut
-- pour les articles encore à 0 en stock.
update inventory_items set stock_updated_at = null where in_stock = 0;
