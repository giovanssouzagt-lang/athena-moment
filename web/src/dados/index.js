/**
 * Ponto único de acesso aos dados. Se as chaves do Supabase existirem
 * (arquivo .env), usa o banco de verdade com login; senão, usa o modo
 * demonstração, com o último sinal salvo e a carteira no próprio aparelho.
 */
import * as demo from './demo.js';
import * as supabase from './supabase.js';

export const modoDemo = !supabase.configurado;
const fonte = modoDemo ? demo : supabase;

export const {
  sessaoAtual, aoMudarSessao, entrar, cadastrar, sair,
  obterSinalAtual, listarHistorico, obterSinal,
  listarAportes, adicionarAporte, apagarAportes,
} = fonte;
