-- salva as metas numa transação só: upsert das categorias + teto do mês (linha sem categoria) + remoção do que saiu.
-- SECURITY INVOKER: roda como o próprio usuário, sob as policies de RLS do budgets (auth.uid() = user_id).
create or replace function public.save_budgets(p_rows jsonb, p_total numeric)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'não autenticado';
  end if;

  -- categorias informadas: só valor > 0 e só categorias do próprio usuário
  insert into public.budgets (user_id, category_id, amount, updated_at)
  select uid, (r->>'category_id')::uuid, (r->>'amount')::numeric, now()
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as r
  where (r->>'amount')::numeric > 0
    and exists (select 1 from public.categories c where c.id = (r->>'category_id')::uuid and c.user_id = uid)
  on conflict (user_id, category_id) do update set amount = excluded.amount, updated_at = now();

  -- teto do mês (category_id nulo; o UNIQUE é NULLS NOT DISTINCT, então o on conflict cobre)
  if p_total is not null and p_total > 0 then
    insert into public.budgets (user_id, category_id, amount, updated_at) values (uid, null, p_total, now())
    on conflict (user_id, category_id) do update set amount = excluded.amount, updated_at = now();
  else
    delete from public.budgets where user_id = uid and category_id is null;
  end if;

  -- categorias que saíram da lista
  delete from public.budgets b
  where b.user_id = uid and b.category_id is not null
    and not exists (
      select 1 from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as r
      where (r->>'category_id')::uuid = b.category_id and (r->>'amount')::numeric > 0
    );
end;
$$;

revoke execute on function public.save_budgets(jsonb, numeric) from public, anon;
grant execute on function public.save_budgets(jsonb, numeric) to authenticated;
