-- Tabelas criadas no SQL Editor não recebem necessariamente grants da Data API.
-- Grants e RLS são camadas distintas. `anon` não acessa dados do Papazilla;
-- `authenticated` só recebe as operações cobertas pelas policies existentes.
revoke all on table public.profiles, public.pets, public.subscriptions,
  public.recipes, public.recipe_preparations from anon;

-- As Vercel Functions usam service_role para autenticação auxiliar, cálculo,
-- cobrança, exportação e exclusão de conta. A chave fica apenas no servidor.
grant select, insert, update, delete on table public.profiles, public.pets,
  public.subscriptions, public.recipes, public.recipe_preparations to service_role;

-- Assinatura: leitura da própria linha. Escrita só pelo servidor.
grant select on table public.subscriptions to authenticated;

-- Receitas: criação só pela API; o usuário lê, renomeia/favorita e exclui as suas.
grant select, update, delete on table public.recipes to authenticated;

-- Preparos: o usuário lê e registra apenas os seus, conforme a policy.
grant select, insert on table public.recipe_preparations to authenticated;
