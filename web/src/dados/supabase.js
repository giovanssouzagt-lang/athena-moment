/**
 * Modo real: Supabase (banco de dados + login por e-mail e senha).
 * As chaves vêm do arquivo .env (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY).
 * A chave "anon" é pública por natureza: quem protege os dados são as regras
 * de segurança do banco (cada usuário só enxerga a própria carteira).
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configurado = Boolean(url && chave);
const db = configurado ? createClient(url, chave) : null;

function checar({ data, error }) {
  if (error) throw new Error(traduzirErro(error.message));
  return data;
}

function traduzirErro(msg) {
  if (/Invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/Email not confirmed/i.test(msg)) return 'Confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (/already registered/i.test(msg)) return 'Este e-mail já tem conta. Use "Entrar".';
  if (/Password should be at least/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  return msg;
}

// ---------- Login ----------

export async function sessaoAtual() {
  const { data } = await db.auth.getSession();
  return data.session?.user ?? null;
}

export function aoMudarSessao(callback) {
  const { data } = db.auth.onAuthStateChange((_evento, sessao) => callback(sessao?.user ?? null));
  return () => data.subscription.unsubscribe();
}

export async function entrar(email, senha) {
  return checar(await db.auth.signInWithPassword({ email, password: senha })).user;
}

export async function cadastrar(email, senha) {
  return checar(await db.auth.signUp({ email, password: senha })).user;
}

export async function sair() {
  await db.auth.signOut();
}

// ---------- Sinais ----------

export async function obterSinalAtual() {
  const linhas = checar(await db.from('sinais').select('conteudo').order('data', { ascending: false }).limit(1));
  if (!linhas.length) throw new Error('Ainda não há sinal gerado. O robô roda nos dias úteis às 18h30.');
  return linhas[0].conteudo;
}

export async function obterSinal(data) {
  return checar(await db.from('sinais').select('conteudo').eq('data', data).single()).conteudo;
}

export async function listarHistorico() {
  return checar(await db.from('sinais').select('data, tickers').order('data', { ascending: false }).limit(120));
}

// ---------- Carteira (anotações de compra e venda) ----------

export async function listarAportes() {
  const linhas = checar(await db.from('aportes').select('*').order('data', { ascending: true }).order('criado_em', { ascending: true }));
  return linhas.map((l) => ({
    id: l.id, ticker: l.ticker, data: l.data, tipo: l.tipo,
    quantidade: l.quantidade, precoUnitario: Number(l.preco_unitario),
  }));
}

export async function adicionarAportes(lista) {
  checar(await db.from('aportes').insert(lista.map(({ ticker, data, quantidade, precoUnitario, tipo = 'compra' }) => (
    { ticker, data, quantidade, preco_unitario: precoUnitario, tipo }
  ))));
}

export const adicionarAporte = (aporte) => adicionarAportes([aporte]);

export async function apagarAporte(id) {
  checar(await db.from('aportes').delete().eq('id', id));
}

export async function apagarAportes() {
  const usuario = await sessaoAtual();
  checar(await db.from('aportes').delete().eq('user_id', usuario.id));
}

// ---------- Stop móvel: maior fechamento desde o início de cada posição ----------

export async function obterTopos(inicios) {
  const pares = await Promise.all(Object.entries(inicios).map(async ([ticker, desde]) => {
    const linhas = checar(await db.from('precos').select('fechamento')
      .eq('ticker', ticker).gte('data', desde).order('fechamento', { ascending: false }).limit(1));
    return [ticker, linhas[0] ? Number(linhas[0].fechamento) : null];
  }));
  return Object.fromEntries(pares.filter(([, v]) => v != null));
}

// ---------- Colchão CDI ----------

export async function obterCaixa() {
  const linha = checar(await db.from('caixa_cdi').select('*').maybeSingle());
  return linha ? { valor: Number(linha.valor), taxaAnual: Number(linha.taxa_anual), atualizadoEm: linha.atualizado_em } : null;
}

export async function salvarCaixa({ valor, taxaAnual }) {
  const usuario = await sessaoAtual();
  checar(await db.from('caixa_cdi').upsert({
    user_id: usuario.id, valor, taxa_anual: taxaAnual, atualizado_em: new Date().toISOString(),
  }));
}
