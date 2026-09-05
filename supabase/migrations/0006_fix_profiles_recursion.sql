-- Corrige une récursion infinie ("infinite recursion detected in policy for
-- relation profiles") : les policies qui vérifient le rôle admin via
-- `exists (select 1 from profiles ...)` déclenchent une boucle dès qu'elles
-- sont évaluées depuis une sous-requête (ex. policies sur property_owner /
-- attachments qui interrogent profiles). Remplacé par une fonction
-- SECURITY DEFINER qui contourne RLS pour cette vérification précise.

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles_admin_manage" on profiles;
create policy "profiles_admin_manage" on profiles
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "property_owner_admin_only" on property_owner;
create policy "property_owner_admin_only" on property_owner
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "attachments_select_authenticated" on attachments;
create policy "attachments_select_authenticated" on attachments
  for select to authenticated
  using (kind <> 'lease_contract' or is_admin());

drop policy if exists "attachments_insert_authenticated" on attachments;
create policy "attachments_insert_authenticated" on attachments
  for insert to authenticated
  with check (kind <> 'lease_contract' or is_admin());

drop policy if exists "attachments_update_authenticated" on attachments;
create policy "attachments_update_authenticated" on attachments
  for update to authenticated
  using (kind <> 'lease_contract' or is_admin())
  with check (kind <> 'lease_contract' or is_admin());

drop policy if exists "attachments_delete_authenticated" on attachments;
create policy "attachments_delete_authenticated" on attachments
  for delete to authenticated
  using (kind <> 'lease_contract' or is_admin());
