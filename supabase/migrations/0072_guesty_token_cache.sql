-- Cache persistant du jeton d'accès Guesty (OAuth2) : le cache en mémoire
-- de lib/inventaire/guesty.ts ne survit pas entre deux invocations
-- serverless Vercel (nouvelle instance à froid) — sans ce cache partagé,
-- chaque appel redemande un nouveau jeton à Guesty, jusqu'à se faire
-- limiter (429 "Too many requests"), constaté en production.

create table guesty_token_cache (
  id text primary key,
  access_token text not null,
  expires_at timestamptz not null
);

alter table guesty_token_cache enable row level security;

create policy "guesty_token_cache_all_authenticated" on guesty_token_cache
  for all to authenticated using (true) with check (true);
