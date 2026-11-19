-- =====================================================================
-- ATHENA INTELIGENTE: notícias, relatório semanal e chat
-- Rode no SQL Editor do Supabase DEPOIS do 002_v26.sql. Pode rodar de novo.
-- =====================================================================

-- Conteúdo gerado pela IA (escrito só pelo robô, com a chave secreta)
--   tipo 'noticias'  -> análise diária das notícias (data = data do sinal)
--   tipo 'relatorio' -> relatório semanal (data = último pregão da semana)
create table if not exists public.ia_conteudo (
  data date not null,
  tipo text not null check (tipo in ('noticias', 'relatorio')),
  conteudo jsonb not null,
  criado_em timestamptz not null default now(),
  primary key (data, tipo)
);

-- Uso do chat: uma linha por pergunta, para limitar o gasto por dia
create table if not exists public.chat_uso (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index if not exists chat_uso_user_dia_idx on public.chat_uso (user_id, criado_em);

alter table public.ia_conteudo enable row level security;
alter table public.chat_uso enable row level security;

drop policy if exists "logados leem conteudo da ia" on public.ia_conteudo;
create policy "logados leem conteudo da ia" on public.ia_conteudo
  for select to authenticated using (true);

drop policy if exists "usuario le o proprio uso do chat" on public.chat_uso;
create policy "usuario le o proprio uso do chat" on public.chat_uso
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "usuario registra o proprio uso do chat" on public.chat_uso;
create policy "usuario registra o proprio uso do chat" on public.chat_uso
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.ia_conteudo, public.chat_uso from anon;
