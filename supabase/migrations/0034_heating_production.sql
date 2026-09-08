-- Eau / Électricité / Gaz : Production Chauffage (Individuelle / Collective / Autre).

alter table property_water_elec add column if not exists heating_production text
  check (heating_production in ('individuelle', 'collective', 'autre'));
alter table property_water_elec add column if not exists heating_production_notes text;
