import { describe, expect, it } from 'vitest';
import { avaliarColchao, gerarAlertas, montarCarteira, resumir } from './carteira.js';
import { planoAporte } from './simulador.js';

const cotacoes = {
  PETR3: { preco: 50, nome: 'Petrobras ON', setor: 'Petroleo' },
  PRIO3: { preco: 40, nome: 'PRIO', setor: 'Petroleo' },
  WEGE3: { preco: 30, nome: 'WEG', setor: 'BensInd' },
};
const top = [{ ticker: 'PETR3', preco: 50, stop: 45 }, { ticker: 'CSMG3', preco: 55, stop: 49.5 }];
const regras = { stopPct: 0.1, limiteSetor: 0.4, cashBuffer: 0.4, tolerancia: 0.15 };
const compra = (ticker, quantidade, precoUnitario, data = '2026-01-01') => ({ ticker, quantidade, precoUnitario, data, tipo: 'compra' });
const venda = (ticker, quantidade, precoUnitario, data = '2026-02-01') => ({ ticker, quantidade, precoUnitario, data, tipo: 'venda' });

describe('montarCarteira', () => {
  it('calcula o preço médio ponderado de várias compras', () => {
    const { posicoes: [p] } = montarCarteira([compra('PETR3', 100, 40), compra('PETR3', 100, 60)], cotacoes);
    expect(p.quantidade).toBe(200);
    expect(p.precoMedio).toBe(50);
  });

  it('uma venda tira as ações e guarda o lucro realizado', () => {
    const { posicoes, lucroRealizado } = montarCarteira([compra('WEGE3', 10, 20), venda('WEGE3', 4, 25)], cotacoes);
    expect(posicoes[0].quantidade).toBe(6);
    expect(posicoes[0].precoMedio).toBe(20); // vender não muda o preço médio
    expect(lucroRealizado).toBe(20); // 4 × (25 − 20)
  });

  it('vender tudo fecha a posição', () => {
    const { posicoes } = montarCarteira([compra('WEGE3', 10, 20), venda('WEGE3', 10, 22)], cotacoes);
    expect(posicoes).toEqual([]);
  });

  it('o stop móvel acompanha o topo desde a compra', () => {
    const { posicoes: [p] } = montarCarteira([compra('PETR3', 10, 40)], cotacoes, { PETR3: 60 });
    expect(p.topo).toBe(60);
    expect(p.stopMovel).toBeCloseTo(54); // 10% abaixo de 60
    expect(resumir([p])).toMatchObject({ investido: 400, valor: 500, lucro: 100 });
  });
});

describe('gerarAlertas', () => {
  it('manda vender quando o preço cai 10% abaixo do topo, mesmo com lucro', () => {
    const { posicoes } = montarCarteira([compra('PETR3', 10, 40)], cotacoes, { PETR3: 60 });
    const alerta = gerarAlertas(posicoes, top, regras).find((a) => a.tipo === 'venda');
    expect(alerta.texto).toMatch(/Hora de vender PETR3/);
    expect(alerta.texto).toMatch(/ainda sai com lucro/);
  });

  it('avisa quando a ação saiu do Top 5', () => {
    const { posicoes } = montarCarteira([compra('WEGE3', 10, 30)], cotacoes);
    expect(gerarAlertas(posicoes, top, regras).some((a) => a.texto.includes('WEGE3: ela saiu do Top 5'))).toBe(true);
  });

  it('avisa colchão baixo e sugere vender a de menor lucro', () => {
    const { posicoes } = montarCarteira([compra('PETR3', 100, 50), compra('WEGE3', 100, 35)], cotacoes);
    const alerta = gerarAlertas(posicoes, top, regras, 100).find((a) => a.texto.includes('abaixo do normal'));
    expect(alerta.texto).toMatch(/Venda parte de WEGE3/);
  });

  it('avisa colchão alto e manda usar o simulador', () => {
    const { posicoes } = montarCarteira([compra('PETR3', 10, 50)], cotacoes);
    expect(gerarAlertas(posicoes, top, regras, 5000).some((a) => a.texto.includes('dinheiro sobrando'))).toBe(true);
  });

  it('sugere comprar o que está no Top 5 e falta na carteira', () => {
    const { posicoes } = montarCarteira([compra('PETR3', 10, 50)], cotacoes);
    const compras = gerarAlertas(posicoes, top, regras).filter((a) => a.tipo === 'compra');
    expect(compras.map((a) => a.texto.split(' ')[1])).toEqual(['CSMG3:']);
  });
});

describe('avaliarColchao', () => {
  it('60/40 dentro da tolerância de 15% está ok', () => {
    expect(avaliarColchao(600, 400, regras).estado).toBe('ok');
    expect(avaliarColchao(600, 360, regras).estado).toBe('ok'); // 37,5% ainda dentro
    expect(avaliarColchao(600, 200, regras).estado).toBe('baixo');
    expect(avaliarColchao(600, 900, regras).estado).toBe('alto');
  });
});

describe('planoAporte', () => {
  // o exemplo da conversa: R$ 600 em ações, R$ 120 por ação
  const precos = [35, 50, 15, 80, 100].map((preco, i) => ({ ticker: `A${i}`, preco, stop: preco * 0.9 }));

  it('divide 60/40 e aproveita as sobras comprando as mais baratas', () => {
    const plano = planoAporte(1000, precos, 0.4);
    // base: 3, 2, 8, 1, 1 (sobram R$ 95); a mais barata (R$ 15) cabe +6 vezes; sobram R$ 5
    expect(plano.itens.map((i) => i.qtd)).toEqual([3, 2, 14, 1, 1]);
    expect(plano.itens[2].extras).toBe(6);
    expect(plano.totalAcoes).toBe(595);
    expect(plano.totalCdi).toBe(405);
    expect(plano.totalAcoes + plano.totalCdi).toBe(1000);
  });

  it('centavos que não compram nenhuma ação vão para o CDI', () => {
    const plano = planoAporte(1000, [{ ticker: 'X', preco: 70, stop: 63 }], 0.4);
    expect(plano.itens[0].qtd).toBe(8); // 600 / 70 = 8 (R$ 560)
    expect(plano.sobraParaCdi).toBe(40);
    expect(plano.totalCdi).toBe(440);
  });
});
