-- Tags libres sur les biens, pour filtrage dans le menu (liste des biens).

alter table properties add column if not exists tags text[] not null default '{}'::text[];
create index if not exists properties_tags_idx on properties using gin (tags);
