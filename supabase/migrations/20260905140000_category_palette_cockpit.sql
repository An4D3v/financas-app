-- paleta categórica das 12 categorias padrão: 11 matizes espaçados + cinza, claro/escuro alternados
-- (a antiga tinha três verdes, dois roxos, ciano×azul, amarelo×laranja e coral×rosa).
-- só troca quem ainda está na cor padrão antiga — preserva qualquer cor personalizada.
update public.categories set color = '#22C55E' where name = 'Moradia'                  and upper(color) = '#39D353';
update public.categories set color = '#FB923C' where name = 'Alimentação'              and upper(color) = '#22D3EE';
update public.categories set color = '#3B82F6' where name = 'Transporte'               and upper(color) = '#A371F7';
update public.categories set color = '#F472B6' where name = 'Saúde'                    and upper(color) = '#F778BA';
update public.categories set color = '#EAB308' where name = 'Educação'                 and upper(color) = '#E3B341';
update public.categories set color = '#A78BFA' where name = 'Lazer'                    and upper(color) = '#58A6FF';
update public.categories set color = '#38BDF8' where name = 'Assinaturas'              and upper(color) = '#FF7B72';
update public.categories set color = '#EF4444' where name = 'Dívidas e parcelas'       and upper(color) = '#7EE787';
update public.categories set color = '#B45309' where name = 'Impostos e contribuições' and upper(color) = '#D2A8FF';
update public.categories set color = '#0D9488' where name = 'Investimentos e reserva'  and upper(color) = '#FFA657';
update public.categories set color = '#84CC16' where name = 'Salário'                  and upper(color) = '#56D364';
update public.categories set color = '#9CA3AF' where name = 'Outros'                   and upper(color) = '#8B949E';

-- contas novas já nascem com a paleta nova (mesma função, mesmos privilégios — só as cores mudam)
create or replace function public.seed_default_categories()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.categories (user_id, name, kind, color) values
    (new.id, 'Moradia',                  'saida',   '#22C55E'),
    (new.id, 'Alimentação',              'saida',   '#FB923C'),
    (new.id, 'Transporte',               'saida',   '#3B82F6'),
    (new.id, 'Saúde',                    'saida',   '#F472B6'),
    (new.id, 'Educação',                 'saida',   '#EAB308'),
    (new.id, 'Lazer',                    'saida',   '#A78BFA'),
    (new.id, 'Assinaturas',              'saida',   '#38BDF8'),
    (new.id, 'Dívidas e parcelas',       'saida',   '#EF4444'),
    (new.id, 'Impostos e contribuições', 'saida',   '#B45309'),
    (new.id, 'Investimentos e reserva',  'ambos',   '#0D9488'),
    (new.id, 'Salário',                  'entrada', '#84CC16'),
    (new.id, 'Outros',                   'saida',   '#9CA3AF');
  return new;
end;
$function$;
