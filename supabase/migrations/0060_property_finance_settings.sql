-- Onglet Finances : association d'un bien à son "listing" VRPlatform, pour
-- calculer le revenu réel et le taux de remplissage mois par mois à partir
-- des réservations VRPlatform.

create table property_finance_settings (
  property_id uuid primary key references properties (id) on delete cascade,
  vrplatform_listing_id text,
  updated_at timestamptz not null default now()
);

create trigger property_finance_settings_set_updated_at
  before update on property_finance_settings
  for each row execute function set_updated_at();

alter table property_finance_settings enable row level security;

create policy "property_finance_settings_all_authenticated" on property_finance_settings
  for all to authenticated using (true) with check (true);
