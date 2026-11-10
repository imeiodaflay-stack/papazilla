-- Ciclo da fornalha na conta + avisos (Flay, 2026-11-10).
-- A fornalha saía só do localStorage; no iPhone o app instalado na tela de
-- início não enxerga os dados do Safari, e o servidor precisa das datas para
-- avisar. O navegador continua com uma cópia local (cache) e grava aqui.

create table if not exists public.fornalhas (
  id text primary key check (char_length(id) between 8 and 80),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  stage text not null check (stage in ('shopping', 'cooking', 'stocked', 'done')),
  -- Último dia com comida (só fornalhas no estoque).
  end_date date,
  -- Snapshot inteiro da fornalha como o app usa (itens, cães, datas, custos).
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pg_column_size(data) <= 200000)
);

create index if not exists fornalhas_owner_updated_idx on public.fornalhas (owner_id, updated_at desc);
create index if not exists fornalhas_stage_idx on public.fornalhas (stage) where stage in ('shopping', 'stocked');

alter table public.fornalhas enable row level security;
drop policy if exists "fornalhas_select_own" on public.fornalhas;
drop policy if exists "fornalhas_insert_own" on public.fornalhas;
drop policy if exists "fornalhas_update_own" on public.fornalhas;
drop policy if exists "fornalhas_delete_own" on public.fornalhas;
create policy "fornalhas_select_own" on public.fornalhas for select using (auth.uid() = owner_id);
create policy "fornalhas_insert_own" on public.fornalhas for insert with check (auth.uid() = owner_id);
create policy "fornalhas_update_own" on public.fornalhas for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "fornalhas_delete_own" on public.fornalhas for delete using (auth.uid() = owner_id);

-- Como a pessoa quer ser avisada. Sem linha = ainda não escolheu.
create table if not exists public.notification_prefs (
  owner_id uuid primary key references public.profiles (id) on delete cascade,
  channel text not null check (channel in ('push', 'email', 'none')),
  updated_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;
drop policy if exists "notification_prefs_select_own" on public.notification_prefs;
drop policy if exists "notification_prefs_insert_own" on public.notification_prefs;
drop policy if exists "notification_prefs_update_own" on public.notification_prefs;
create policy "notification_prefs_select_own" on public.notification_prefs for select using (auth.uid() = owner_id);
create policy "notification_prefs_insert_own" on public.notification_prefs for insert with check (auth.uid() = owner_id);
create policy "notification_prefs_update_own" on public.notification_prefs for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Um registro por aparelho com os avisos ligados (Web Push).
create table if not exists public.push_subscriptions (
  endpoint text primary key check (endpoint like 'https://%' and char_length(endpoint) <= 2000),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_owner_idx on public.push_subscriptions (owner_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "push_subscriptions_select_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_insert_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_update_own" on public.push_subscriptions;
drop policy if exists "push_subscriptions_delete_own" on public.push_subscriptions;
create policy "push_subscriptions_select_own" on public.push_subscriptions for select using (auth.uid() = owner_id);
create policy "push_subscriptions_insert_own" on public.push_subscriptions for insert with check (auth.uid() = owner_id);
create policy "push_subscriptions_update_own" on public.push_subscriptions for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "push_subscriptions_delete_own" on public.push_subscriptions for delete using (auth.uid() = owner_id);

-- Avisos já enviados: cada tipo sai uma vez por fornalha. Só o servidor lê e grava.
create table if not exists public.notification_log (
  fornalha_id text not null,
  kind text not null check (kind in ('plan_next', 'shopping_waiting', 'overdue')),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  channel text not null check (channel in ('push', 'email')),
  sent_at timestamptz not null default now(),
  primary key (fornalha_id, kind)
);

alter table public.notification_log enable row level security;

revoke all on table public.fornalhas, public.notification_prefs, public.push_subscriptions, public.notification_log from anon;
revoke all on table public.notification_log from authenticated;
grant select, insert, update, delete on table public.fornalhas, public.push_subscriptions to authenticated;
grant select, insert, update on table public.notification_prefs to authenticated;
grant select, insert, update, delete on table public.fornalhas, public.notification_prefs,
  public.push_subscriptions, public.notification_log to service_role;
