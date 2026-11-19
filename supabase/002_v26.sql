-- =====================================================================
-- ATHENA MOMENT v26: colchão CDI, stop móvel e anotação de vendas
-- Rode no SQL Editor do Supabase DEPOIS do schema.sql. Pode rodar de novo.
-- =====================================================================

-- ---------- Preços: fechamentos diários (para o stop móvel) ----------
create table if not exists public.precos (
  ticker text not null,
  data date not null,
  fechamento numeric(14, 4) not null,
  primary key (ticker, data)
);

-- ---------- Colchão CDI: quanto cada usuário tem no CDI ----------
create table if not exists public.caixa_cdi (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  valor numeric(14, 2) not null default 0 check (valor >= 0),
  taxa_anual numeric(6, 2) not null default 14 check (taxa_anual >= 0),  -- % ao ano, para a projeção
  atualizado_em timestamptz not null default now()
);

-- ---------- Aportes: agora a anotação pode ser de compra OU de venda ----------
alter table public.aportes add column if not exists tipo text not null default 'compra';
alter table public.aportes drop constraint if exists aportes_tipo_check;
alter table public.aportes add constraint aportes_tipo_check check (tipo in ('compra', 'venda'));

-- A visão da carteira passa a descontar as vendas
create or replace view public.carteira with (security_invoker = true) as
select
  user_id,
  ticker,
  sum(case when tipo = 'compra' then quantidade else -quantidade end) as quantidade,
  round(
    sum(case when tipo = 'compra' then quantidade * preco_unitario else 0 end)
    / nullif(sum(case when tipo = 'compra' then quantidade else 0 end), 0), 4
  ) as preco_medio_compras
from public.aportes
group by user_id, ticker;

-- ---------- Segurança ----------
alter table public.precos enable row level security;
alter table public.caixa_cdi enable row level security;

drop policy if exists "logados leem precos" on public.precos;
create policy "logados leem precos" on public.precos
  for select to authenticated using (true);

drop policy if exists "usuario le o proprio caixa" on public.caixa_cdi;
create policy "usuario le o proprio caixa" on public.caixa_cdi
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "usuario cria o proprio caixa" on public.caixa_cdi;
create policy "usuario cria o proprio caixa" on public.caixa_cdi
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "usuario atualiza o proprio caixa" on public.caixa_cdi;
create policy "usuario atualiza o proprio caixa" on public.caixa_cdi
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.precos, public.caixa_cdi from anon;
