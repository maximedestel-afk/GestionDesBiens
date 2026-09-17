-- Certains biens correspondent à deux listings VRPlatform distincts (ex.
-- "14ECO" et "14ECO 1") : cette référence supplémentaire permet de les
-- regrouper dans le tableau financier d'un même bien.

create table property_finance_settings (
  property_id uuid primary key references properties (id) on delete cascade,
  extra_vrplatform_reference text,
  updated_at timestamptz not null default now()
);

create trigger property_finance_settings_set_updated_at
  before update on property_finance_settings
  for each row execute function set_updated_at();

alter table property_finance_settings enable row level security;

create policy "property_finance_settings_all_authenticated" on property_finance_settings
  for all to authenticated using (true) with check (true);
