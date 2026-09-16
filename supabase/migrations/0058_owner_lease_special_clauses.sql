-- Bail : clauses particulières (balises [Clause Particulière 1] et
-- [Clause Particulière 2]).

alter table property_owner add column if not exists lease_special_clause_1 text;
alter table property_owner add column if not exists lease_special_clause_2 text;
