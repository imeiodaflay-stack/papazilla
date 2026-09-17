-- Assinatura real (substitui o `localStorage.setItem` da Fase 0 — qualquer
-- pessoa podia "assinar de graça" editando o navegador). Fonte de verdade
-- agora é essa tabela, escrita só pelas Vercel Functions server-side
-- (`service_role`, nunca a chave publishable do navegador) a partir da
-- confirmação de pagamento via webhook do Asaas — nunca a partir do clique
-- do usuário nem do redirecionamento de volta do checkout.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  -- 'none': nunca iniciou checkout. 'pending': checkout criado, aguardando
  -- confirmação do Asaas. 'active': pago e com acesso liberado. 'past_due':
  -- cobrança da renovação falhou. 'canceled': renovação cancelada (o acesso
  -- continua até `current_period_end`, ver `hasActiveAccess` no frontend).
  status text not null default 'none' check (status in ('none', 'pending', 'active', 'past_due', 'canceled')),
  plan text not null default 'annual',
  asaas_customer_id text,
  asaas_checkout_id text,
  asaas_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is
  'Assinatura real via Asaas. Só server-side (service_role) grava; o app só lê a própria linha.';
comment on column public.subscriptions.status is
  'none/pending/active/past_due/canceled — ver nota da tabela. Nunca confiar no redirecionamento do checkout pra liberar acesso, só nesse status.';

create index subscriptions_asaas_checkout_id_idx on public.subscriptions (asaas_checkout_id);
create index subscriptions_asaas_subscription_id_idx on public.subscriptions (asaas_subscription_id);

alter table public.subscriptions enable row level security;

-- Só leitura da própria linha. Sem policy de insert/update/delete pra
-- usuários autenticados de propósito — só a service_role (que ignora RLS)
-- pode escrever, e ela só roda nas Vercel Functions (`/api`), nunca no
-- navegador.
create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
