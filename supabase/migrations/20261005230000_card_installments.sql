-- Cartão em até 12x com renovação anual automática (Flay, 2026-10-05).
-- A assinatura recorrente do Asaas não aceita parcelamento, então cada ano
-- vira um parcelamento no cartão (POST /payments com installmentCount), e a
-- renovação é feita pelo nosso servidor (`/api/subscription-renew`, cron
-- diário) com o token do cartão devolvido pelo Asaas na primeira compra.

alter table public.subscriptions
  add column if not exists auto_renew boolean not null default false,
  add column if not exists installment_count integer
    check (installment_count is null or installment_count between 1 and 12),
  add column if not exists asaas_installment_id text,
  -- Pagamento que liberou o período atual. Evita que o mesmo pagamento
  -- (CONFIRMED e depois RECEIVED) ou as outras parcelas estendam o acesso.
  add column if not exists activated_payment_id text,
  -- Data de fim de período para a qual a renovação automática já foi tentada.
  add column if not exists renewal_attempted_for timestamptz;

create index if not exists subscriptions_asaas_installment_id_idx
  on public.subscriptions (asaas_installment_id);

comment on column public.subscriptions.auto_renew is
  'true: cartão com renovação automática pelo cron. false: Pix, ou renovação cancelada.';

-- Token do cartão fica numa tabela separada, sem nenhuma policy: o navegador
-- (mesmo logado) nunca lê. Só a service_role, nas Vercel Functions.
create table if not exists public.subscription_card_tokens (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  asaas_credit_card_token text not null,
  card_brand text,
  card_last4 text,
  updated_at timestamptz not null default now()
);

alter table public.subscription_card_tokens enable row level security;
revoke all on table public.subscription_card_tokens from anon, authenticated;
grant select, insert, update, delete on table public.subscription_card_tokens to service_role;

-- Assinaturas antigas no cartão (recorrência do próprio Asaas) seguem
-- renovando sozinhas: marca como renovação ligada para a tela de conta.
update public.subscriptions
  set auto_renew = true
  where asaas_subscription_id is not null and status = 'active' and payment_method = 'credit_card';
