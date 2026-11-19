/**
 * Modo demonstração: sem banco e sem login.
 * O sinal vem de public/demo/ultimo_sinal.json; carteira e colchão ficam
 * salvos no próprio navegador (localStorage).
 */
const CHAVE = 'athena_aportes_demo';
const CHAVE_CAIXA = 'athena_caixa_demo';
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

function ler(chave, padrao) {
  try {
    return JSON.parse(localStorage.getItem(chave)) ?? padrao;
  } catch {
    return padrao;
  }
}
const gravar = (chave, valor) => localStorage.setItem(chave, JSON.stringify(valor));

export const listarAportes = async () => ler(CHAVE, []);
export async function adicionarAportes(lista) {
  gravar(CHAVE, [...ler(CHAVE, []), ...lista.map((a) => ({ id: crypto.randomUUID(), tipo: 'compra', ...a }))]);
}
export const adicionarAporte = (aporte) => adicionarAportes([aporte]);
export async function apagarAporte(id) {
  gravar(CHAVE, ler(CHAVE, []).filter((a) => a.id !== id));
}
export async function apagarAportes() {
  localStorage.removeItem(CHAVE);
}

/** Na demonstração só há o gráfico de 6 meses das ações do Top 5. */
export async function obterTopos(inicios) {
  const s = await carregarSinal();
  const topos = {};
  for (const [ticker, desde] of Object.entries(inicios)) {
    const serie = s.top.find((a) => a.ticker === ticker)?.serie ?? [];
    const valores = serie.filter((p) => p.d >= desde).map((p) => p.c);
    if (valores.length) topos[ticker] = Math.max(...valores);
  }
  return topos;
}

export const obterCaixa = async () => ler(CHAVE_CAIXA, null);
export async function salvarCaixa({ valor, taxaAnual }) {
  gravar(CHAVE_CAIXA, { valor, taxaAnual, atualizadoEm: new Date().toISOString() });
}

// ---------- Athena Inteligente (sem conteúdo na demonstração) ----------

export const obterNoticias = async () => null;
export const listarRelatorios = async () => [];
