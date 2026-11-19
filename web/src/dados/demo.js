/**
 * Modo demonstração: sem banco e sem login.
 * O sinal vem de public/demo/ultimo_sinal.json e a carteira fica salva no
 * próprio navegador (localStorage).
 */
const CHAVE = 'athena_aportes_demo';
let cacheSinal = null;

async function carregarSinal() {
  if (!cacheSinal) {
    const r = await fetch(`${import.meta.env.BASE_URL}demo/ultimo_sinal.json`);
    if (!r.ok) throw new Error('Sinal de demonstração não encontrado.');
    cacheSinal = await r.json();
  }
  return cacheSinal;
}

const usuarioDemo = { email: 'demonstracao@athena' };

export const sessaoAtual = async () => usuarioDemo;
export const aoMudarSessao = () => () => {};
export const entrar = async () => usuarioDemo;
export const cadastrar = async () => usuarioDemo;
export const sair = async () => {};

export const obterSinalAtual = carregarSinal;
export const obterSinal = async () => carregarSinal();
export async function listarHistorico() {
  const s = await carregarSinal();
  return [{ data: s.data, tickers: s.top.map((a) => a.ticker) }];
}

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || [];
  } catch {
    return [];
  }
}

export const listarAportes = async () => ler();
export async function adicionarAporte(aporte) {
  const lista = ler();
  lista.push({ id: crypto.randomUUID(), ...aporte });
  localStorage.setItem(CHAVE, JSON.stringify(lista));
}
export async function apagarAportes() {
  localStorage.removeItem(CHAVE);
}
