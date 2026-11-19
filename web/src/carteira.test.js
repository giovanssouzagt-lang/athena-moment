import { describe, expect, it } from 'vitest';
import { gerarAlertas, montarPosicoes, resumir } from './carteira.js';

const cotacoes = {
  PETR3: { preco: 50, nome: 'Petrobras ON', setor: 'Petroleo' },
  PRIO3: { preco: 40, nome: 'PRIO', setor: 'Petroleo' },
  WEGE3: { preco: 30, nome: 'WEG', setor: 'BensInd' },
};
const top = [{ ticker: 'PETR3', preco: 50, stop: 39 }, { ticker: 'CSMG3', preco: 55, stop: 43 }];
const regras = { stopPct: 0.22, limiteSetor: 0.4 };

describe('montarPosicoes', () => {
  it('calcula o preço médio ponderado de várias compras', () => {
    const [p] = montarPosicoes(
      [{ ticker: 'PETR3', quantidade: 100, precoUnitario: 40 }, { ticker: 'PETR3', quantidade: 100, precoUnitario: 60 }],
      cotacoes,
    );
    expect(p.quantidade).toBe(200);
    expect(p.precoMedio).toBe(50);
    expect(p.lucro).toBe(0);
  });

  it('calcula lucro em reais e em porcentagem', () => {
    const [p] = montarPosicoes([{ ticker: 'WEGE3', quantidade: 10, precoUnitario: 20 }], cotacoes);
    expect(p.lucro).toBe(100);
    expect(p.lucroPct).toBeCloseTo(0.5);
    expect(resumir([p])).toMatchObject({ investido: 200, valor: 300, lucro: 100 });
  });
});

describe('gerarAlertas', () => {
  it('manda vender quando o preço cai 22% abaixo do preço médio', () => {
    const pos = montarPosicoes([{ ticker: 'PETR3', quantidade: 10, precoUnitario: 70 }], cotacoes);
    const alertas = gerarAlertas(pos, top, regras);
    expect(alertas.find((a) => a.tipo === 'venda').texto).toMatch(/Vender PETR3/);
  });

  it('avisa quando a ação saiu do Top 5', () => {
    const pos = montarPosicoes([{ ticker: 'WEGE3', quantidade: 10, precoUnitario: 30 }], cotacoes);
    expect(gerarAlertas(pos, top, regras).some((a) => a.texto.includes('WEGE3 saiu do Top 5'))).toBe(true);
  });

  it('avisa concentração alta num setor', () => {
    const pos = montarPosicoes(
      [
        { ticker: 'PETR3', quantidade: 10, precoUnitario: 50 },
        { ticker: 'PRIO3', quantidade: 10, precoUnitario: 40 },
        { ticker: 'WEGE3', quantidade: 1, precoUnitario: 30 },
      ],
      cotacoes,
    );
    expect(gerarAlertas(pos, top, regras).some((a) => a.texto.includes('Concentração alta no setor Petróleo'))).toBe(true);
  });

  it('sugere comprar o que está no Top 5 e falta na carteira', () => {
    const pos = montarPosicoes([{ ticker: 'PETR3', quantidade: 10, precoUnitario: 50 }], cotacoes);
    const compras = gerarAlertas(pos, top, regras).filter((a) => a.tipo === 'compra');
    expect(compras.map((a) => a.texto.split(' ')[0])).toEqual(['CSMG3']);
  });
});
