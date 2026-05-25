-- Verbo Hub V6 - Banco online Supabase
-- Abra Supabase > SQL Editor > New query, cole tudo e clique Run.

create table if not exists public.verbohub_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.verbohub_state enable row level security;

-- Para o sistema interno da loja funcionar sem login.
-- Se depois quiser login por funcionário, dá para deixar mais restrito.
drop policy if exists "verbohub_select" on public.verbohub_state;
drop policy if exists "verbohub_insert" on public.verbohub_state;
drop policy if exists "verbohub_update" on public.verbohub_state;
drop policy if exists "verbohub_delete" on public.verbohub_state;

create policy "verbohub_select"
on public.verbohub_state for select
to anon, authenticated
using (true);

create policy "verbohub_insert"
on public.verbohub_state for insert
to anon, authenticated
with check (true);

create policy "verbohub_update"
on public.verbohub_state for update
to anon, authenticated
using (true)
with check (true);

create policy "verbohub_delete"
on public.verbohub_state for delete
to anon, authenticated
using (true);

-- Ativa realtime para a tabela, caso ainda não esteja ativado.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename = 'verbohub_state'
  ) then
    alter publication supabase_realtime add table public.verbohub_state;
  end if;
end $$;
