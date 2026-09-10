-- Onglet "TA - Tâches" : pense-bêtes rattachés à un onglet (et une section
-- libre, ex. "Gestion des clés") d'un bien, assignables à un utilisateur,
-- cochables une fois faits, avec un fil de réponses horodatées.

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties (id) on delete cascade,
  tab_key text not null,
  section text,
  text text not null,
  created_by uuid references profiles (id),
  created_by_email text,
  created_at timestamptz not null default now(),
  assigned_to uuid references profiles (id),
  done boolean not null default false,
  done_by uuid references profiles (id),
  done_by_email text,
  done_at timestamptz
);

create index if not exists tasks_property_id_idx on tasks (property_id, created_at desc);

create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  text text not null,
  created_by uuid references profiles (id),
  created_by_email text,
  created_at timestamptz not null default now()
);

create index if not exists task_comments_task_id_idx on task_comments (task_id, created_at asc);

alter table tasks enable row level security;
alter table task_comments enable row level security;

create policy "tasks_all_authenticated" on tasks
  for all to authenticated using (true) with check (true);

create policy "task_comments_all_authenticated" on task_comments
  for all to authenticated using (true) with check (true);
