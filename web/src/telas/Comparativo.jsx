import { Grafico } from '../componentes/Grafico.jsx';
import { pct } from '../carteira.js';

export function Comparativo({ sinal }) {
  const c = sinal.comparativo;
  if (!c) return <p className="aviso aviso-atencao">⚠️ O comparativo com o BOVA11 não está disponível hoje: os dados do índice não puderam ser baixados.</p>;
  const diferenca = c.retorno_top5 - c.retorno_bova;
  return (
    <section>
      <div className="titulo-secao">
        <h2>Top 5 contra o BOVA11</h2>
        <p>Como as 5 ações de hoje se saíram nos últimos 12 meses, comparadas ao índice.</p>
      </div>

      <div className="resumo">
        <div><span className="rotulo">Top 5 (pesos iguais)</span><strong className="texto-ouro">{c.retorno_top5 >= 0 ? '+' : ''}{pct(c.retorno_top5)}</strong></div>
        <div><span className="rotulo">BOVA11</span><strong className="texto-prata">{c.retorno_bova >= 0 ? '+' : ''}{pct(c.retorno_bova)}</strong></div>
        <div><span className="rotulo">Diferença</span><strong className={diferenca >= 0 ? 'texto-verde' : 'texto-vermelho'}>{diferenca >= 0 ? '+' : ''}{pct(diferenca)}</strong></div>
      </div>

      <div className="painel-grafico">
        <div className="legenda">
          <span><i style={{ background: '#d4af37' }} /> Top 5 de hoje</span>
          <span><i style={{ background: '#c0c0c8' }} /> BOVA11</span>
        </div>
        <Grafico altura={220} rotulos={c.datas} series={[
          { nome: 'Top 5', valores: c.top5, cor: '#d4af37' },
          { nome: 'BOVA11', valores: c.bova, cor: '#c0c0c8' },
        ]} />
        <p className="nota">Os dois começam em 100. Se a linha dourada termina em 150, as ações subiram 50%.</p>
      </div>

      <p className="aviso aviso-atencao">
        ⚠️ Leia com cuidado: este gráfico mostra o passado das ações escolhidas <strong>hoje</strong>. Elas foram escolhidas justamente por terem subido, então a comparação favorece o Top 5. Ele não mostra o resultado que a estratégia teria tido operando mês a mês; para isso existe o backtest.
      </p>
    </section>
  );
}
