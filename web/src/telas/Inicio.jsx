import { useState } from 'react';
import { adicionarAportes, salvarCaixa } from '../dados/index.js';
import { gerarAlertas, pct, reais } from '../carteira.js';
import { planoAporte } from '../simulador.js';
import { regrasDoSinal, useCarteira } from '../useCarteira.js';

const ICONE = { venda: '🔴', atencao: '⚠️', compra: '🟢', ok: '✅' };
const hoje = () => new Date().toISOString().slice(0, 10);

function Simulador({ sinal, caixa, aoAnotar }) {
  const cb = sinal.parametros.cash_buffer ?? 0.4;
  const [valor, setValor] = useState('');
  const [plano, setPlano] = useState(null);
  const [anotando, setAnotando] = useState(false);
  const [anotado, setAnotado] = useState(false);

  function calcular(e) {
    e.preventDefault();
    setAnotado(false);
    setPlano(planoAporte(Number(valor), sinal.top, cb));
  }

  async function anotar() {
    setAnotando(true);
    const compras = plano.itens.filter((i) => i.qtd > 0)
      .map((i) => ({ ticker: i.ticker, data: hoje(), quantidade: i.qtd, precoUnitario: i.preco, tipo: 'compra' }));
    await adicionarAportes(compras);
    await salvarCaixa({ valor: (caixa?.valor ?? 0) + plano.totalCdi, taxaAnual: caixa?.taxaAnual ?? 14 });
    setAnotando(false);
    setAnotado(true);
    aoAnotar();
  }

  return (
    <div className="painel">
      <h2 className="pergunta">Quanto quer investir hoje?</h2>
      <p className="nota">O Athena divide pela regra {pct(1 - cb)} em ações e {pct(cb)} no CDI, calcula quantas ações inteiras comprar e usa o troco para comprar mais ações baratas.</p>
      <form className="linha-simulador" onSubmit={calcular}>
        <span className="prefixo">R$</span>
        <input type="number" min="1" step="0.01" inputMode="decimal" placeholder="1.000,00" required
          value={valor} onChange={(e) => setValor(e.target.value)} aria-label="Valor para investir hoje" />
        <button className="botao-primario">Calcular Plano de Aporte</button>
      </form>

      {plano && (
        <div className="plano">
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead><tr><th>Ação</th><th>Comprar</th><th>Custo</th><th>Stop</th></tr></thead>
              <tbody>
                {plano.itens.map((i) => (
                  <tr key={i.ticker} className={i.qtd === 0 ? 'linha-apagada' : ''}>
                    <td><strong>{i.ticker}</strong><small className="texto-suave">{reais(i.preco)} cada</small></td>
                    <td><strong className="texto-ouro">{i.qtd}</strong>{i.extras > 0 && <small>+{i.extras} com o troco</small>}</td>
                    <td>{reais(i.custo)}</td>
                    <td className="texto-vermelho">{reais(i.stop)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {plano.itens.some((i) => i.qtd === 0) && (
            <p className="aviso aviso-atencao">⚠️ Alguma ação custa mais que a parte reservada para ela ({reais(plano.valor * (1 - cb) / plano.itens.length)}). Com um valor maior ela entra no plano.</p>
          )}
          <div className="resumo">
            <div><span className="rotulo">Em ações</span><strong>{reais(plano.totalAcoes)}</strong></div>
            <div><span className="rotulo">No CDI (colchão)</span><strong className="texto-ouro">{reais(plano.totalCdi)}</strong></div>
            <div><span className="rotulo">Troco que foi ao CDI</span><strong>{reais(plano.sobraParaCdi)}</strong></div>
          </div>
          {anotado ? (
            <p className="aviso aviso-ok">✅ Anotado! As compras estão na aba Carteira e {reais(plano.totalCdi)} foi somado ao seu colchão. Agora é só comprar no app da corretora usando esta lista como cola.</p>
          ) : (
            <button className="botao-secundario largo" onClick={anotar} disabled={anotando}>
              {anotando ? 'Anotando…' : `Anotar estas compras e somar ${reais(plano.totalCdi)} ao colchão`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Inicio({ sinal }) {
  const c = useCarteira(sinal);
  const alertas = c.carregando || c.erro ? [] : gerarAlertas(c.posicoes, sinal.top, regrasDoSinal(sinal), c.caixa?.valor ?? null);

  return (
    <section>
      <Simulador sinal={sinal} caixa={c.caixa} aoAnotar={c.recarregar} />

      <h3 className="subtitulo">O que fazer hoje</h3>
      {c.carregando && <p className="carregando">Conferindo sua carteira…</p>}
      {c.erro && <p className="aviso aviso-venda">Não foi possível carregar a carteira: {c.erro}</p>}
      {!c.carregando && !c.erro && !c.posicoes.length && (
        <p className="aviso aviso-ok">✅ Sua carteira ainda está vazia. Use o simulador acima para montar a primeira, ou anote compras que você já tem na aba Carteira.</p>
      )}
      {c.posicoes.length > 0 && alertas.map((a, i) => (
        <p key={i} className={`aviso aviso-${a.tipo}`}><span aria-hidden>{ICONE[a.tipo]}</span> {a.texto}</p>
      ))}
    </section>
  );
}
