/**
 * Cálculos da carteira (anotações de compra e venda, preço médio, stop
 * móvel, colchão CDI) e os alertas de "o que fazer hoje".
 * Funções puras: recebem dados e devolvem resultados, sem tocar no banco.
 */

const pct = (v) => `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
const reais = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const SETOR_LEGIVEL = {
  Petroleo: 'Petróleo', Mineracao: 'Mineração', Saude: 'Saúde', Construcao: 'Construção',
  BensInd: 'Bens Industriais', Logistica: 'Logística', Educacao: 'Educação',
};
export const nomeSetor = (s) => SETOR_LEGIVEL[s] || s;
export { pct, reais };

/**
 * Monta as posições a partir das anotações.
 * - compra: soma quantidade e custo (preço médio ponderado)
 * - venda: tira quantidade ao preço médio e guarda o lucro realizado
 * topos: { TICKER: maior fechamento desde o início da posição } (opcional)
 */
export function montarCarteira(aportes, cotacoes, topos = {}, stopPct = 0.1) {
  const ordenados = [...aportes].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
  const pos = new Map();
  let lucroRealizado = 0;

  for (const a of ordenados) {
    const q = Number(a.quantidade), preco = Number(a.precoUnitario);
    const p = pos.get(a.ticker) || { ticker: a.ticker, quantidade: 0, custo: 0, inicio: null };
    if ((a.tipo || 'compra') === 'compra') {
      if (p.quantidade === 0) p.inicio = a.data;
      p.quantidade += q;
      p.custo += q * preco;
    } else {
      const vendida = Math.min(q, p.quantidade);
      if (vendida > 0) {
        const medio = p.custo / p.quantidade;
        lucroRealizado += (preco - medio) * vendida;
        p.custo -= medio * vendida;
        p.quantidade -= vendida;
        if (p.quantidade === 0) { p.custo = 0; p.inicio = null; }
      }
    }
    pos.set(a.ticker, p);
  }

  const posicoes = [...pos.values()]
    .filter((p) => p.quantidade > 0)
    .map((p) => {
      const cot = cotacoes[p.ticker];
      const precoMedio = p.custo / p.quantidade;
      const precoAtual = cot ? cot.preco : precoMedio;
      // Stop MÓVEL: 10% abaixo do maior preço desde a compra (nunca desce)
      const topo = Math.max(precoMedio, precoAtual, topos[p.ticker] ?? 0);
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
        topo,
        stopMovel: topo * (1 - stopPct),
      };
    })
    .sort((a, b) => b.valor - a.valor);

  return { posicoes, lucroRealizado };
}

export function resumir(posicoes) {
  const investido = posicoes.reduce((s, p) => s + p.custo, 0);
  const valor = posicoes.reduce((s, p) => s + p.valor, 0);
  return { investido, valor, lucro: valor - investido, lucroPct: investido ? valor / investido - 1 : 0 };
}

/**
 * Situação do colchão: quanto deveria estar no CDI (40% do patrimônio).
 * estado: 'baixo' | 'alto' | 'ok' | 'sem-dados'
 */
export function avaliarColchao(valorAcoes, caixa, { cashBuffer, tolerancia }) {
  if (caixa == null) return { estado: 'sem-dados' };
  const patrimonio = valorAcoes + caixa;
  if (patrimonio <= 0) return { estado: 'sem-dados' };
  const ideal = patrimonio * cashBuffer;
  const atual = caixa / patrimonio;
  let estado = 'ok';
  if (caixa > ideal * (1 + tolerancia)) estado = 'alto';
  else if (caixa < ideal * (1 - tolerancia)) estado = 'baixo';
  return { estado, patrimonio, ideal, atual, diferenca: caixa - ideal };
}

/**
 * Alertas textuais, sempre explicando o motivo e o próximo passo.
 * tipo: 'venda' (vermelho), 'atencao' (amarelo), 'compra' (verde), 'ok'
 */
export function gerarAlertas(posicoes, top, regras, caixa = null) {
  const { stopPct, limiteSetor, cashBuffer, tolerancia } = regras;
  const vendas = [], atencao = [], compras = [], ok = [];
  const noTop = new Set(top.map((a) => a.ticker));
  const valorAcoes = posicoes.reduce((s, p) => s + p.valor, 0);

  for (const p of posicoes) {
    if (p.precoAtual <= p.stopMovel) {
      const quedaDoTopo = 1 - p.precoAtual / p.topo;
      const resultado = p.lucroPct >= 0
        ? `Vendendo agora você ainda sai com lucro de ${pct(p.lucroPct)}.`
        : 'Vender agora limita o prejuízo.';
      vendas.push({
        tipo: 'venda',
        texto: `Hora de vender ${p.ticker}: caiu ${pct(quedaDoTopo)} desde o topo (${reais(p.topo)}) e bateu o stop móvel de ${pct(stopPct)} (${reais(p.stopMovel)}). ${resultado} Depois, anote a venda e compre uma ação do Top 5.`,
      });
    } else if (!noTop.has(p.ticker)) {
      vendas.push({
        tipo: 'atencao',
        texto: `Hora de vender ${p.ticker}: ela saiu do Top 5 e perdeu força. A estratégia gira o capital para as ações mais fortes: venda, anote a venda e compre uma do Top 5.`,
      });
    }
  }

  const colchao = avaliarColchao(valorAcoes, caixa, { cashBuffer, tolerancia });
  if (colchao.estado === 'alto') {
    atencao.push({
      tipo: 'atencao',
      texto: `Seu colchão está com dinheiro sobrando: ${reais(caixa)} no CDI, mas o ideal (${pct(cashBuffer)} do patrimônio) é ${reais(colchao.ideal)}. Use ${reais(colchao.diferenca)} para comprar ações do Top 5: o simulador da tela Início calcula as quantidades.`,
    });
  } else if (colchao.estado === 'baixo') {
    const pior = [...posicoes].sort((a, b) => a.lucroPct - b.lucroPct)[0];
    atencao.push({
      tipo: 'atencao',
      texto: `Seu colchão está abaixo do normal: ${reais(caixa)} no CDI, o ideal é ${reais(colchao.ideal)}. Faltam ${reais(-colchao.diferenca)}. ${pior ? `Venda parte de ${pior.ticker} (a de menor lucro, ${pct(pior.lucroPct)}) e coloque no CDI,` : 'Coloque dinheiro novo no CDI,'} ou direcione os próximos aportes para o colchão.`,
    });
  } else if (colchao.estado === 'ok') {
    ok.push({ tipo: 'ok', texto: `Colchão equilibrado: ${reais(caixa)} no CDI (${pct(colchao.atual)} do patrimônio, o ideal é ${pct(cashBuffer)}).` });
  } else if (posicoes.length) {
    atencao.push({ tipo: 'atencao', texto: 'Você ainda não informou quanto tem no CDI. Abra a aba Colchão e anote o valor, para o Athena conferir a regra 60/40.' });
  }

  if (valorAcoes > 0 && posicoes.length > 1) {
    const porSetor = {};
    for (const p of posicoes) porSetor[p.setor] = (porSetor[p.setor] || 0) + p.valor;
    for (const [setor, valor] of Object.entries(porSetor)) {
      const peso = valor / valorAcoes;
      if (peso > limiteSetor) {
        atencao.push({
          tipo: 'atencao',
          texto: `Concentração alta no setor ${nomeSetor(setor)}: ${pct(peso)} das suas ações. Acima de ${pct(limiteSetor)}, uma notícia ruim do setor pesa muito no seu patrimônio.`,
        });
      }
    }
  }

  const tenho = new Set(posicoes.map((p) => p.ticker));
  for (const a of top) {
    if (!tenho.has(a.ticker)) {
      compras.push({
        tipo: 'compra',
        texto: `Comprar ${a.ticker}: está no Top 5 e não está na sua carteira (preço ${reais(a.preco)}, stop inicial ${reais(a.stop)}).`,
      });
    }
  }

  if (posicoes.length && !vendas.length && !atencao.length) {
    ok.unshift({ tipo: 'ok', texto: 'Ações em dia: nenhuma bateu o stop móvel ou saiu do Top 5.' });
  }
  return [...vendas, ...atencao, ...compras, ...ok];
}
