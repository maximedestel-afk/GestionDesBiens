-- Clés API pour permettre à un autre programme de se connecter à l'API
-- (app/api/v1/...) sans passer par une session utilisateur Supabase Auth.
-- Seul le hash (SHA-256) de la clé est stocké ; la clé en clair n'est
-- montrée qu'une seule fois, à sa création.

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  created_at timestamptz not null default now(),
  created_by_email text,
  last_used_at timestamptz,
  revoked_at timestamptz
);

alter table api_keys enable row level security;

create policy "api_keys_all_authenticated" on api_keys
  for all to authenticated using (true) with check (true);
