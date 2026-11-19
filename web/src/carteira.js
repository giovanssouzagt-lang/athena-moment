/**
 * Cálculos da carteira (preço médio, lucro/prejuízo) e alertas.
 * Funções puras: recebem dados e devolvem resultados, sem tocar no banco.
 */

export function montarPosicoes(aportes, cotacoes) {
  const porTicker = new Map();
  for (const a of aportes) {
    const p = porTicker.get(a.ticker) || { ticker: a.ticker, quantidade: 0, custo: 0 };
    p.quantidade += Number(a.quantidade);
    p.custo += Number(a.quantidade) * Number(a.precoUnitario);
    porTicker.set(a.ticker, p);
  }
  return [...porTicker.values()]
    .filter((p) => p.quantidade > 0)
    .map((p) => {
      const cot = cotacoes[p.ticker];
      const precoMedio = p.custo / p.quantidade;
      const precoAtual = cot ? cot.preco : precoMedio;
      const valor = p.quantidade * precoAtual;
      return {
        ...p,
        nome: cot?.nome ?? p.ticker,
        setor: cot?.setor ?? 'Outros',
        semCotacao: !cot,
        precoMedio,
        precoAtual,
        valor,
        lucro: valor - p.custo,
        lucroPct: precoAtual / precoMedio - 1,
      };
    })
    .sort((a, b) => b.valor - a.valor);
}

export function resumir(posicoes) {
  const investido = posicoes.reduce((s, p) => s + p.custo, 0);
  const valor = posicoes.reduce((s, p) => s + p.valor, 0);
  return { investido, valor, lucro: valor - investido, lucroPct: investido ? valor / investido - 1 : 0 };
}

const pct = (v) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const reais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const SETOR_LEGIVEL = {
  Petroleo: 'Petróleo', Mineracao: 'Mineração', Saude: 'Saúde', Construcao: 'Construção',
  BensInd: 'Bens Industriais', Tecnologia: 'Tecnologia', Logistica: 'Logística', Educacao: 'Educação',
};
export const nomeSetor = (s) => SETOR_LEGIVEL[s] || s;

/**
 * Alertas textuais, sempre explicando o motivo.
 * tipo: 'venda' (vermelho), 'atencao' (amarelo/laranja), 'compra' (verde), 'ok'
 */
export function gerarAlertas(posicoes, top, { stopPct, limiteSetor }) {
  const alertas = [];
  const noTop = new Set(top.map((a) => a.ticker));
  const valorTotal = posicoes.reduce((s, p) => s + p.valor, 0);

  for (const p of posicoes) {
    const stop = p.precoMedio * (1 - stopPct);
    if (p.precoAtual <= stop) {
      alertas.push({
        tipo: 'venda',
        texto: `Vender ${p.ticker}: caiu ${pct(-p.lucroPct)} do seu preço médio (${reais(p.precoMedio)}) e passou do stop de ${pct(stopPct)} (${reais(stop)}). Vender agora limita o prejuízo.`,
      });
    } else if (!noTop.has(p.ticker)) {
      alertas.push({
        tipo: 'atencao',
        texto: `${p.ticker} saiu do Top 5 de hoje. A estratégia gira o capital para as ações mais fortes: avalie vender e trocar por uma do Top 5.`,
      });
    }
  }

  if (valorTotal > 0) {
    const porSetor = {};
    for (const p of posicoes) porSetor[p.setor] = (porSetor[p.setor] || 0) + p.valor;
    for (const [setor, valor] of Object.entries(porSetor)) {
      const peso = valor / valorTotal;
      if (peso > limiteSetor && posicoes.length > 1) {
        alertas.push({
          tipo: 'atencao',
          texto: `Concentração alta no setor ${nomeSetor(setor)}: ${pct(peso)} da carteira. Acima de ${pct(limiteSetor)}, uma notícia ruim do setor pesa muito no seu patrimônio.`,
        });
      }
    }
  }

  const tenho = new Set(posicoes.map((p) => p.ticker));
  for (const a of top) {
    if (!tenho.has(a.ticker)) {
      alertas.push({
        tipo: 'compra',
        texto: `${a.ticker} está no Top 5 de hoje e não está na sua carteira (preço ${reais(a.preco)}, stop ${reais(a.stop)}).`,
      });
    }
  }

  if (posicoes.length && !alertas.some((a) => a.tipo !== 'compra')) {
    alertas.unshift({ tipo: 'ok', texto: 'Carteira alinhada com a estratégia: nenhuma ação passou do stop ou saiu do Top 5.' });
  }
  return alertas;
}

export { pct, reais };
