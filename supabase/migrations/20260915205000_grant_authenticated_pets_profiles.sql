-- CREATE TABLE via SQL Editor não concede privilégios automaticamente pro
-- role `authenticated` (diferente de criar pela Table Editor UI). RLS por si
-- só não é suficiente — sem o GRANT, toda query volta "permission denied"
-- mesmo com a policy certa. Descoberto ao testar o cadastro de pet de
-- verdade: GET/POST em public.pets voltava 42501.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.pets to authenticated;
