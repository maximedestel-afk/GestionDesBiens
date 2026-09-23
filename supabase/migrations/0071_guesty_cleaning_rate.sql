-- Onglet DATA : coût du ménage, synchronisé dans les deux sens avec le
-- champ personnalisé Guesty "cleaning_rate" du listing correspondant.

alter table property_data add column guesty_listing_id text;
alter table property_data add column cleaning_rate numeric;
alter table property_data add column guesty_last_synced_at timestamptz;
alter table property_data add column guesty_last_sync_error text;
