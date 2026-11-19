import { useState } from 'react';
import { Grafico } from '../componentes/Grafico.jsx';
import { nomeSetor, pct, reais } from '../carteira.js';
import { Comparativo } from './Comparativo.jsx';

export function CartaoAcao({ acao }) {
  const serie = acao.serie.map((p) => p.c);
  const variacao6m = serie.length ? serie[serie.length - 1] / serie[0] - 1 : 0;
  return (
    <article className="cartao-acao">
      <header className="cartao-topo">
        <span className="posicao">{acao.posicao}</span>
        <div className="cartao-titulo">
          <h3>{acao.ticker}</h3>
          <p>{acao.nome} · {nomeSetor(acao.setor)}</p>
        </div>
        {acao.escassez && <span className="tag-ouro" title="Empresa de recursos finitos: prioridade na estratégia">Escassez</span>}
      </header>

      <div className="cartao-numeros">
        <div>
          <span className="rotulo">Preço atual</span>
          <strong>{reais(acao.preco)}</strong>
        </div>
        <div>
          <span className="rotulo">Stop inicial</span>
          <strong className="texto-vermelho">{reais(acao.stop)}</strong>
        </div>
        <div>
          <span className="rotulo">Força 12 meses</span>
          <strong className="texto-verde">+{pct(acao.momentum)}</strong>
        </div>
      </div>

      {acao.dist_sma != null && (
        <p className={`selo-timing ${acao.ponto_de_compra ? 'selo-compra' : 'selo-respiro'}`}>
          {acao.ponto_de_compra
            ? `🟢 Ponto de compra: ${acao.dist_sma >= 0 ? `${pct(acao.dist_sma)} acima` : `${pct(-acao.dist_sma)} abaixo`} da média de 50 dias`
            : `🟡 Respiro: ${pct(acao.dist_sma)} acima da média de 50 dias (ainda dentro do limite de 8%)`}
        </p>
      )}

      <div className="cartao-grafico">
        <Grafico compacto altura={70} series={[{ nome: `${acao.ticker} 6 meses`, valores: serie, cor: '#d4af37' }]} />
        <span className={variacao6m >= 0 ? 'texto-verde' : 'texto-vermelho'}>
          {variacao6m >= 0 ? '+' : ''}{pct(variacao6m)} em 6 meses
        </span>
      </div>
    </article>
  );
}

export function Top5({ sinal }) {
  const [explicar, setExplicar] = useState(false);
  const p = sinal.parametros;
  return (
    <section>
      <div className="titulo-secao">
        <h2>Top 5 de hoje</h2>
        <p>As ações mais fortes da B3 segundo a estratégia Athena.</p>
      </div>

      {sinal.top.map((a) => <CartaoAcao key={a.ticker} acao={a} />)}

      <button className="botao-secundario largo" onClick={() => setExplicar(!explicar)}>
        {explicar ? 'Esconder explicação' : 'Como o Top 5 é escolhido?'}
      </button>
      {explicar && (
        <ol className="explicacao">
          <li><strong>Força:</strong> o Athena mede quanto cada uma das {sinal.acoes_analisadas} ações subiu em ~12 meses, ignorando o último mês, e descarta as que caíram.</li>
          <li><strong>Escassez:</strong> entre as 10 mais fortes, empresas de recursos finitos (petróleo, mineração, energia, saneamento, papel) passam na frente.</li>
          <li><strong>Diversificação:</strong> no máximo {p.max_por_setor} ações do mesmo setor, e a mesma empresa não entra duas vezes (ex.: PETR3 e PETR4).</li>
          {p.timing_limit != null && (
            <li><strong>Respiro:</strong> ação que está mais de {pct(p.timing_limit)} acima da média de 50 dias está "esticada" e é pulada: a próxima do ranking entra no lugar. Você nunca fica sem 5 opções.</li>
          )}
          <li><strong>Stop móvel:</strong> começa {pct(p.stop_pct)} abaixo do preço de compra e sobe junto com a ação. Se ela cair {pct(p.stop_pct)} a partir do topo, o Athena manda vender.</li>
          {p.cash_buffer != null && (
            <li><strong>Colchão:</strong> só {pct(1 - p.cash_buffer)} do patrimônio vai para ações; {pct(p.cash_buffer)} fica no CDI para amortecer quedas.</li>
          )}
        </ol>
      )}

      <div className="separador" />
      <Comparativo sinal={sinal} />
    </section>
  );
}
