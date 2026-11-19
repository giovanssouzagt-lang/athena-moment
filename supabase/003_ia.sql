-- =====================================================================
-- ATHENA INTELIGENTE: notícias e relatório semanal
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

alter table public.ia_conteudo enable row level security;

drop policy if exists "logados leem conteudo da ia" on public.ia_conteudo;
create policy "logados leem conteudo da ia" on public.ia_conteudo
  for select to authenticated using (true);

revoke all on public.ia_conteudo from anon;
