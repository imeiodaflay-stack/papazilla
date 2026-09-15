-- Passo 4 da "Ordem de implementação" (arquitetura-tecnica.md): migrations e
-- RLS para `profiles` e `pets`. Só identidade — respostas de saúde, rotina e
-- preferências alimentares (o que hoje mora em StoredPet.healthConditions,
-- .proteins etc. em apps/web/src/lib/petsStore.ts) ficam para `pet_anamneses`,
-- uma tabela futura e versionada; esta migration não tenta antecipar esse
-- modelo. O app continua lendo/escrevendo em localStorage até o passo 5
-- (migrar a UI para falar com essas tabelas).

-- profiles: dados do humano ligados a auth.users. Uma linha por usuário,
-- criada automaticamente no primeiro login por `handle_new_user` (abaixo).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Dados do humano ligados a auth.users. Criada automaticamente no primeiro login (ver handle_new_user).';

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- pets: identidade atual do Monstrinho e foto.
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  breed text,
  sex text check (sex in ('macho', 'femea')),
  neutered boolean,
  life_stage text check (life_stage in ('adulto', 'filhote')),
  birth_date date,
  weight_kg numeric(5, 2) check (weight_kg > 0),
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pets is
  'Identidade atual do Monstrinho (nome, raça, peso, foto). Perguntas de saúde/rotina/preferências vivem em pet_anamneses (ainda não criada).';
comment on column public.pets.photo_path is
  'Caminho do objeto no bucket pet-photos do Storage, não a URL completa.';

create index pets_owner_id_idx on public.pets (owner_id);

alter table public.pets enable row level security;

create policy "pets_select_own" on public.pets
  for select using (auth.uid() = owner_id);

create policy "pets_insert_own" on public.pets
  for insert with check (auth.uid() = owner_id);

create policy "pets_update_own" on public.pets
  for update using (auth.uid() = owner_id);

create policy "pets_delete_own" on public.pets
  for delete using (auth.uid() = owner_id);

-- updated_at automático nas duas tabelas.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger pets_set_updated_at
  before update on public.pets
  for each row execute function public.set_updated_at();

-- Cria a linha em profiles automaticamente no primeiro login (Google hoje;
-- Apple/e-mail quando entrarem no Supabase Auth). security definer porque o
-- trigger roda ao inserir em auth.users, antes de haver um JWT do próprio
-- usuário pra passar pela RLS normal de profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
