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

// ---------- Carteira ----------

export async function listarAportes() {
  const linhas = checar(await db.from('aportes').select('*').order('data', { ascending: true }));
  return linhas.map((l) => ({ id: l.id, ticker: l.ticker, data: l.data, quantidade: l.quantidade, precoUnitario: Number(l.preco_unitario) }));
}

export async function adicionarAporte({ ticker, data, quantidade, precoUnitario }) {
  checar(await db.from('aportes').insert({ ticker, data, quantidade, preco_unitario: precoUnitario }));
}

export async function apagarAportes() {
  const usuario = await sessaoAtual();
  checar(await db.from('aportes').delete().eq('user_id', usuario.id));
}
