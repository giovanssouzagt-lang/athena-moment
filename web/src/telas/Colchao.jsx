import { useEffect, useState } from 'react';
import { salvarCaixa } from '../dados/index.js';
import { avaliarColchao, pct, reais, resumir } from '../carteira.js';
import { regrasDoSinal, useCarteira } from '../useCarteira.js';

const MENSAGEM = {
  ok: { classe: 'aviso-ok', icone: '✅', texto: 'Colchão equilibrado. Nada a fazer por aqui.' },
  alto: { classe: 'aviso-atencao', icone: '⚠️' },
  baixo: { classe: 'aviso-atencao', icone: '⚠️' },
};

export function Colchao({ sinal }) {
  const c = useCarteira(sinal);
  const regras = regrasDoSinal(sinal);
  const cb = regras.cashBuffer;
  const [valor, setValor] = useState('');
  const [taxa, setTaxa] = useState(14);
  const [anos, setAnos] = useState(5);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (c.caixa) {
      setValor(c.caixa.valor);
      setTaxa(c.caixa.taxaAnual);
    }
  }, [c.caixa]);

  if (c.erro) return <p className="aviso aviso-venda">Não foi possível carregar o colchão: {c.erro}</p>;
  if (c.carregando) return <p className="carregando">Carregando colchão…</p>;

  const valorAcoes = resumir(c.posicoes).valor;
  const caixa = c.caixa?.valor ?? null;
  const situacao = avaliarColchao(valorAcoes, caixa, regras);
  const projecao = (caixa ?? 0) * (1 + taxa / 100) ** anos;

  async function salvar(e) {
    e.preventDefault();
    await salvarCaixa({ valor: Number(valor) || 0, taxaAnual: Number(taxa) || 0 });
    setSalvo(true);
    c.recarregar();
  }

  return (
    <section>
      <div className="titulo-secao">
        <h2>Colchão CDI</h2>
        <p>A proteção do Athena: {pct(cb)} do seu patrimônio fica no CDI, fora da bolsa.</p>
      </div>

      <div className="painel explicacao-colchao">
        <strong>Para cada R$ 100 que você investe:</strong>
        <div className="divisao">
          <div style={{ flex: 1 - cb }}><span>R$ {100 - cb * 100}</span>ações (R$ {((100 - cb * 100) / 5).toFixed(0)} em cada uma das 5)</div>
          <div style={{ flex: cb }} className="divisao-cdi"><span>R$ {cb * 100}</span>CDI</div>
        </div>
        <p className="nota">Se a bolsa cair, o CDI continua rendendo e amortece a queda. E ele vira "munição": quando o Athena mandar comprar uma ação do Top 5, você usa esse dinheiro, e depois repõe o colchão.</p>
      </div>

      <form className="formulario" onSubmit={salvar}>
        <div className="linha-campos">
          <label>Quanto você tem hoje no CDI (R$)
            <input type="number" min="0" step="0.01" inputMode="decimal" value={valor} required onChange={(e) => { setValor(e.target.value); setSalvo(false); }} />
          </label>
          <label>Rendimento (% ao ano)
            <input type="number" min="0" step="0.01" inputMode="decimal" value={taxa} onChange={(e) => { setTaxa(e.target.value); setSalvo(false); }} />
          </label>
        </div>
        <p className="nota">O CDI fica numa aplicação de liquidez diária (CDB, Tesouro Selic ou a "caixinha" do seu banco). Atualize o valor quando mexer nele. O rendimento é só para a projeção: ajuste para a taxa que você recebe.</p>
        <button className="botao-primario">{salvo ? 'Colchão salvo ✓' : 'Salvar Colchão'}</button>
      </form>

      {situacao.estado !== 'sem-dados' && (
        <>
          <div className="resumo">
            <div><span className="rotulo">Patrimônio total</span><strong>{reais(situacao.patrimonio)}</strong></div>
            <div><span className="rotulo">Ações (ideal {pct(1 - cb)})</span><strong>{reais(valorAcoes)} · {pct(1 - situacao.atual)}</strong></div>
            <div><span className="rotulo">CDI (ideal {pct(cb)})</span><strong className="texto-ouro">{reais(caixa)} · {pct(situacao.atual)}</strong></div>
            <div><span className="rotulo">CDI ideal hoje</span><strong>{reais(situacao.ideal)}</strong></div>
          </div>

          <div className="barra-colchao" aria-label={`Ações ${pct(1 - situacao.atual)}, CDI ${pct(situacao.atual)}`}>
            <div style={{ width: `${(1 - situacao.atual) * 100}%` }} />
            <i style={{ left: `${(1 - cb) * 100}%` }} title="Divisão ideal" />
          </div>

          <p className={`aviso ${MENSAGEM[situacao.estado].classe}`}>
            {MENSAGEM[situacao.estado].icone}{' '}
            {situacao.estado === 'ok' && MENSAGEM.ok.texto}
            {situacao.estado === 'alto' && `Colchão alto: sobram ${reais(situacao.diferenca)} no CDI. Use esse valor no simulador da tela Início para comprar ações do Top 5.`}
            {situacao.estado === 'baixo' && `Colchão baixo: faltam ${reais(-situacao.diferenca)} para chegar a ${pct(cb)}. Venda parte da ação de menor lucro (veja em Início) ou coloque dinheiro novo no CDI.`}
          </p>
        </>
      )}

      {caixa > 0 && (
        <div className="painel">
          <h3 className="subtitulo">Projeção do colchão</h3>
          <label className="rotulo-slider">Daqui a {anos} {anos === 1 ? 'ano' : 'anos'}
            <input type="range" min="1" max="10" value={anos} onChange={(e) => setAnos(Number(e.target.value))} />
          </label>
          <p>Mantendo {reais(caixa)} a {taxa}% ao ano, sem novos aportes: <strong className="texto-ouro">{reais(projecao)}</strong></p>
          <p className="nota">Projeção bruta, antes do imposto de renda. Taxas mudam com o tempo.</p>
        </div>
      )}
    </section>
  );
}
