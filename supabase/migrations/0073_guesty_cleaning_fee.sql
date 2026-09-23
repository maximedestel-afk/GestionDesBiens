-- Prix du ménage facturé au voyageur (champ standard Guesty
-- prices.cleaningFee, distinct du champ personnalisé "cleaning_rate" déjà
-- synchronisé, qui est le coût payé au prestataire).

alter table property_data add column guesty_cleaning_fee numeric;
