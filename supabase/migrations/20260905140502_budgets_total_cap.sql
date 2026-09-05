-- teto geral do mês: uma linha de budgets SEM categoria (category_id nulo), no máximo uma por usuário.
-- (o índice parcial desta migração foi substituído pela seguinte, que usa UNIQUE NULLS NOT DISTINCT)
alter table public.budgets alter column category_id drop not null;
create unique index if not exists budgets_total_per_user on public.budgets (user_id) where category_id is null;
