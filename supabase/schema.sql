-- =====================================================================
-- ATHENA MOMENT: estrutura do banco de dados (Supabase / PostgreSQL)
-- Rode uma vez no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- =====================================================================

-- ---------- Ativos: as 75 ações do universo ----------
create table if not exists public.ativos (
  ticker text primary key,
  nome text not null,
  setor text not null,
  escassez boolean not null default false,
  empresa_canonica text not null
);

-- ---------- Sinais: o Top 5 de cada dia (Sinal_Historico) ----------
create table if not exists public.sinais (
  data date primary key,
  tickers text[] not null,            -- as 5 escolhidas, para a lista do histórico
  conteudo jsonb not null,            -- tudo o que o app mostra (gráficos, ranking, cotações)
  criado_em timestamptz not null default now()
);

-- ---------- Aportes: cada compra registrada pelo usuário ----------
create table if not exists public.aportes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ticker text not null,
  data date not null,
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(12, 2) not null check (preco_unitario > 0),
  criado_em timestamptz not null default now()
);
create index if not exists aportes_user_id_idx on public.aportes (user_id);

-- ---------- Carteira: posição consolidada (preço médio) de cada usuário ----------
-- security_invoker: a visão respeita as regras de segurança de quem consulta
create or replace view public.carteira with (security_invoker = true) as
select
  user_id,
  ticker,
  sum(quantidade) as quantidade,
  round(sum(quantidade * preco_unitario) / sum(quantidade), 4) as preco_medio
from public.aportes
group by user_id, ticker;

-- =====================================================================
-- SEGURANÇA (RLS)
-- Ativos e sinais: qualquer usuário logado pode LER; só o robô escreve
-- (o robô usa a chave secreta "service_role", que ignora o RLS).
-- Aportes: cada usuário lê, cria e apaga SÓ as próprias compras.
-- =====================================================================
alter table public.ativos enable row level security;
alter table public.sinais enable row level security;
alter table public.aportes enable row level security;

drop policy if exists "logados leem ativos" on public.ativos;
create policy "logados leem ativos" on public.ativos
  for select to authenticated using (true);

drop policy if exists "logados leem sinais" on public.sinais;
create policy "logados leem sinais" on public.sinais
  for select to authenticated using (true);

drop policy if exists "usuario le os proprios aportes" on public.aportes;
create policy "usuario le os proprios aportes" on public.aportes
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "usuario cria os proprios aportes" on public.aportes;
create policy "usuario cria os proprios aportes" on public.aportes
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "usuario apaga os proprios aportes" on public.aportes;
create policy "usuario apaga os proprios aportes" on public.aportes
  for delete to authenticated using (auth.uid() = user_id);

-- Visitantes sem login não acessam nada
revoke all on public.ativos, public.sinais, public.aportes, public.carteira from anon;
