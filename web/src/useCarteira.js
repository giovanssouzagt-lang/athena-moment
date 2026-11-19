/**
 * Carrega anotações, topos de preço (stop móvel) e colchão, e devolve a
 * carteira já calculada. Usado pelas telas Início, Carteira e Colchão.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { listarAportes, obterCaixa, obterTopos } from './dados/index.js';
import { montarCarteira } from './carteira.js';

export function useCarteira(sinal) {
  const [estado, setEstado] = useState({ carregando: true });

  const recarregar = useCallback(async () => {
    try {
      const [aportes, caixa] = await Promise.all([listarAportes(), obterCaixa()]);
      // início de cada posição aberta, para buscar o maior preço desde então
      const { posicoes } = montarCarteira(aportes, sinal.cotacoes);
      const inicios = Object.fromEntries(posicoes.map((p) => [p.ticker, p.inicio]));
      const topos = posicoes.length ? await obterTopos(inicios) : {};
      setEstado({ carregando: false, aportes, caixa, topos });
    } catch (e) {
      setEstado({ carregando: false, erro: e.message });
    }
  }, [sinal]);

  useEffect(() => { recarregar(); }, [recarregar]);

  const carteira = useMemo(() => {
    if (!estado.aportes) return null;
    return montarCarteira(estado.aportes, sinal.cotacoes, estado.topos, sinal.parametros.stop_pct);
  }, [estado, sinal]);

  return {
    carregando: estado.carregando,
    erro: estado.erro,
    aportes: estado.aportes ?? [],
    caixa: estado.caixa ?? null,
    posicoes: carteira?.posicoes ?? [],
    lucroRealizado: carteira?.lucroRealizado ?? 0,
    recarregar,
  };
}

export function regrasDoSinal(sinal) {
  const p = sinal.parametros;
  return {
    stopPct: p.stop_pct,
    limiteSetor: p.limite_setor ?? 0.4,
    cashBuffer: p.cash_buffer ?? 0.4,
    tolerancia: p.tolerancia_colchao ?? 0.15,
  };
}
