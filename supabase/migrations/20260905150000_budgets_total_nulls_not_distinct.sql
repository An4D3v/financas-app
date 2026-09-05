-- o teto do mês (category_id nulo) passa a caber no MESMO UNIQUE das categorias, com NULLS NOT DISTINCT (PG 15+):
-- assim o upsert on_conflict (user_id, category_id) cobre a linha do teto e a gravação vira idempotente, sem estado local.
alter table public.budgets drop constraint if exists budgets_user_id_category_id_key;
alter table public.budgets add constraint budgets_user_id_category_id_key unique nulls not distinct (user_id, category_id);
drop index if exists public.budgets_total_per_user;
