-- Checkout transparente: o ciclo anual pode ser pago por cartão recorrente
-- ou Pix avulso. Dados sensíveis do cartão nunca entram no banco; guardamos
-- apenas os identificadores necessários para conciliação por webhook.
alter table public.subscriptions
  add column if not exists payment_method text
    check (payment_method is null or payment_method in ('credit_card', 'pix')),
  add column if not exists asaas_payment_id text;

create index if not exists subscriptions_asaas_payment_id_idx
  on public.subscriptions (asaas_payment_id);

comment on column public.subscriptions.payment_method is
  'credit_card: renovação anual automática; pix: acesso anual com renovação manual.';
comment on column public.subscriptions.asaas_payment_id is
  'Cobrança avulsa usada no pagamento anual por Pix.';
