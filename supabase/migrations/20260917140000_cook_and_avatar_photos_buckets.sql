-- Dois buckets novos, mesmo padrão de `20260917120000_pet_photos_bucket.sql`
-- (público pra leitura, escrita restrita ao dono via `<owner_id>/...`):
-- `cook-photos` pra foto do prato num preparo registrado (`RecipeCookLogScreen`)
-- e `avatars` pra foto de perfil do tutor (`ContaScreen`).
insert into storage.buckets (id, name, public)
values ('cook-photos', 'cook-photos', true), ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "cook_photos_public_read" on storage.objects
  for select using (bucket_id = 'cook-photos');

create policy "cook_photos_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'cook-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cook_photos_owner_update" on storage.objects
  for update using (
    bucket_id = 'cook-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cook_photos_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'cook-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
