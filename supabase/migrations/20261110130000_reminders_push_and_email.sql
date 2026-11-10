-- Avisos pelo celular E por e-mail ao mesmo tempo (Flay, 2026-11-10): a
-- escolha única (`channel`) vira duas chaves independentes.

alter table public.notification_prefs
  add column if not exists push boolean not null default false,
  add column if not exists email boolean not null default false;

do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'notification_prefs' and column_name = 'channel') then
    update public.notification_prefs set push = (channel = 'push'), email = (channel = 'email');
    alter table public.notification_prefs drop column channel;
  end if;
end $$;

-- O registro do que saiu passa a aceitar os dois canais juntos.
alter table public.notification_log drop constraint if exists notification_log_channel_check;
alter table public.notification_log add constraint notification_log_channel_check
  check (channel in ('push', 'email', 'push,email'));
