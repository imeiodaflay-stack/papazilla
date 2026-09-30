-- Login por e-mail: antes de enviar o código, o app pergunta (via Vercel
-- Function com service_role) se já existe conta com esse e-mail criada por
-- Google ou Apple, pra avisar a pessoa em vez de abrir uma conta confusa.
-- Só o service_role executa; o navegador nunca chama essa função direto.
create or replace function public.auth_providers_for_email(p_email text)
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(distinct i.provider order by i.provider), '{}')
  from auth.identities i
  join auth.users u on u.id = i.user_id
  where lower(u.email) = lower(trim(p_email));
$$;

revoke all on function public.auth_providers_for_email(text) from public, anon, authenticated;
grant execute on function public.auth_providers_for_email(text) to service_role;
