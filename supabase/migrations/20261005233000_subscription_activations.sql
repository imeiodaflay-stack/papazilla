-- Revisão do parcelamento (2026-10-05): cada pagamento/parcelamento libera
-- 12 meses uma vez só, para sempre. A chave fica registrada aqui; um aviso
-- repetido ou atrasado (mesmo de um ano anterior) não estende o acesso de novo.
create table if not exists public.subscription_activations (
  activation_key text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.subscription_activations enable row level security;
revoke all on table public.subscription_activations from anon, authenticated;
grant select, insert, update, delete on table public.subscription_activations to service_role;

-- IP do cliente na compra com cartão, reaproveitado na renovação automática
-- (o Asaas pede o IP do pagador em cobranças no cartão).
alter table public.subscription_card_tokens add column if not exists customer_ip text;
