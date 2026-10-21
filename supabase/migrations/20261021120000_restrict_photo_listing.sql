-- Fecha a listagem pública dos buckets de fotos (`pet-photos`, `cook-photos`,
-- `avatars`). As políticas de SELECT antigas valiam pra qualquer papel, inclusive
-- anônimo, então a API de listagem do Storage devolvia as pastas (IDs de
-- usuário) e todos os arquivos. Os buckets seguem públicos: o app mostra as
-- fotos só por `getPublicUrl`, que não passa por RLS e continua funcionando.
--
-- A leitura passa a ser só do dono, logado, na própria pasta `<owner_id>/...`.
-- Ela não é removida de vez porque o upload usa `upsert: true`, que precisa
-- enxergar a linha do próprio dono.

drop policy if exists "pet_photos_public_read" on storage.objects;
drop policy if exists "cook_photos_public_read" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;

create policy "pet_photos_owner_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'pet-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "cook_photos_owner_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'cook-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_select" on storage.objects
  for select to authenticated using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
