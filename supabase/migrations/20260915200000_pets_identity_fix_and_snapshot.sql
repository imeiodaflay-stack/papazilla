-- Ajusta `pets` (criada em 20260915193410) pra bater com os valores reais
-- que a Anamnese usa (apps/web/src/routes/AnamneseScreen.tsx): 'Macho'/'Fêmea'
-- e 'Adulto'/'Filhote', não os placeholders em minúsculo sem acento que a
-- migration anterior chutou antes de eu conferir a UI.
--
-- birth_date e weight_kg saem: hoje o app guarda "idade" e "peso" como texto
-- livre digitado na Anamnese (ex.: "3 anos", "12,5"), não em formato
-- parseável com segurança pra uma coluna tipada. Ficam dentro do novo
-- `anamnesis_snapshot`, junto com o resto dos campos de StoredPet que ainda
-- não têm uma tabela própria (pet_anamneses, versionada — trabalho futuro,
-- ver arquitetura-tecnica.md). Nenhuma linha real existe ainda em nenhum dos
-- dois projetos, então não há dado pra migrar.

alter table public.pets
  drop constraint pets_sex_check,
  drop constraint pets_life_stage_check,
  drop constraint pets_weight_kg_check,
  drop column weight_kg,
  drop column birth_date;

alter table public.pets
  add constraint pets_sex_check check (sex in ('Macho', 'Fêmea')),
  add constraint pets_life_stage_check check (life_stage in ('Adulto', 'Filhote'));

alter table public.pets
  add column anamnesis_snapshot jsonb not null default '{}'::jsonb;

comment on column public.pets.anamnesis_snapshot is
  'Bridge temporário: idade, peso, rotina, saúde e preferências — todo o resto de StoredPet que ainda não tem coluna própria. Sai daqui quando pet_anamneses existir.';
