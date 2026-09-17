-- Bucket de fotos dos pets (Storage). `pets.photo_path` já existia desde a
-- primeira migration, mas sem upload de verdade ligado a ele ainda.
--
-- Público pra leitura (mostra a foto no app sem precisar assinar URL toda
-- vez — não é dado sensível). Só o dono pode enviar/substituir/apagar, via
-- o primeiro segmento do caminho do objeto (`<owner_id>/<arquivo>`), igual
-- ao padrão de `owner_id` usado em `pets`.
insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

create policy "pet_photos_public_read" on storage.objects
  for select using (bucket_id = 'pet-photos');

create policy "pet_photos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pet_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
