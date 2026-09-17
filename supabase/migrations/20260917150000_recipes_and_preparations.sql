-- Receitas calculadas no servidor. O resultado e os perfis usados são snapshots:
-- editar ou excluir um pet não altera uma receita já salva.
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  engine_version text not null,
  pet_ids uuid[] not null,
  formulation text not null,
  supplement text not null,
  selection jsonb not null,
  days integer not null check (days between 1 and 30),
  format text not null,
  result jsonb not null,
  pet_plans jsonb not null,
  custom_title text check (custom_title is null or char_length(custom_title) <= 120),
  favorite boolean not null default false,
  check (cardinality(pet_ids) > 0)
);

create index recipes_owner_created_idx on public.recipes (owner_id, created_at desc);
alter table public.recipes enable row level security;
create policy "recipes_select_own" on public.recipes for select using (auth.uid() = owner_id);
create policy "recipes_update_own" on public.recipes for update
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "recipes_delete_own" on public.recipes for delete using (auth.uid() = owner_id);
-- Sem INSERT para o cliente: somente /api/recipes-create (service_role) calcula e grava.

create function public.protect_recipe_snapshot() returns trigger language plpgsql as $$
begin
  if row(old.owner_id, old.created_at, old.engine_version, old.pet_ids,
         old.formulation, old.supplement, old.selection, old.days, old.format,
         old.result, old.pet_plans)
     is distinct from
     row(new.owner_id, new.created_at, new.engine_version, new.pet_ids,
         new.formulation, new.supplement, new.selection, new.days, new.format,
         new.result, new.pet_plans) then
    raise exception 'O cálculo e o perfil usados nesta receita não podem ser alterados';
  end if;
  return new;
end;
$$;
create trigger recipes_protect_snapshot before update on public.recipes
  for each row execute function public.protect_recipe_snapshot();

create table public.recipe_preparations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  prepared_at timestamptz not null default now(),
  pet_ids uuid[] not null,
  rating integer not null check (rating between 1 and 5),
  note text not null default '',
  photo_path text not null default '',
  check (cardinality(pet_ids) > 0),
  check (char_length(note) <= 1000)
);

create index recipe_preparations_recipe_date_idx on public.recipe_preparations (recipe_id, prepared_at desc);
alter table public.recipe_preparations enable row level security;
create policy "recipe_preparations_select_own" on public.recipe_preparations
  for select using (auth.uid() = owner_id);
create policy "recipe_preparations_insert_own" on public.recipe_preparations
  for insert with check (
    auth.uid() = owner_id and exists (
      select 1 from public.recipes r
      where r.id = recipe_preparations.recipe_id
        and r.owner_id = auth.uid()
        and recipe_preparations.pet_ids <@ r.pet_ids
    )
  );
