import { useState } from 'react';
import { adicionarAporte, apagarAporte, apagarAportes } from '../dados/index.js';
import { nomeSetor, pct, reais, resumir } from '../carteira.js';
import { useCarteira } from '../useCarteira.js';
import { dataBR } from './Historico.jsx';

const hoje = () => new Date().toISOString().slice(0, 10);

function FormularioAnotacao({ tipo, sinal, posicoes, aoSalvar, aoCancelar }) {
  const venda = tipo === 'venda';
  const opcoes = venda ? posicoes.map((p) => p.ticker) : Object.keys(sinal.cotacoes).sort();
  const maximo = (t) => posicoes.find((p) => p.ticker === t)?.quantidade ?? 0;
  const [ticker, setTicker] = useState(opcoes[0]);
  const [quantidade, setQuantidade] = useState(venda ? maximo(opcoes[0]) : 100);
  const [preco, setPreco] = useState(sinal.cotacoes[opcoes[0]]?.preco ?? 0);
  const [data, setData] = useState(hoje());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  function trocarAcao(t) {
    setTicker(t);
    setPreco(sinal.cotacoes[t]?.preco ?? 0);
    if (venda) setQuantidade(maximo(t));
  }

  async function salvar(e) {
    e.preventDefault();
    if (quantidade <= 0 || preco <= 0) return setErro('Quantidade e preço precisam ser maiores que zero.');
    if (venda && quantidade > maximo(ticker)) return setErro(`Você só tem ${maximo(ticker)} ações de ${ticker} anotadas.`);
    setSalvando(true);
    try {
      await adicionarAporte({ ticker, data, quantidade: Number(quantidade), precoUnitario: Number(preco), tipo });
      aoSalvar();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={salvar}>
      <p className="nota">{venda
        ? 'Anote aqui a venda que você fez no app da corretora, para o Athena tirar a ação da sua carteira.'
        : 'Anote a compra que você fez (ou vai fazer) no app da corretora. O Athena acompanha lucro, stop e alertas.'}</p>
      <label>Ação
        <select value={ticker} onChange={(e) => trocarAcao(e.target.value)}>
          {opcoes.map((t) => <option key={t} value={t}>{t} · {sinal.cotacoes[t]?.nome ?? t}</option>)}
        </select>
      </label>
      <div className="linha-campos">
        <label>Quantidade
          <input type="number" min="1" step="1" inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </label>
        <label>{venda ? 'Preço de venda (R$)' : 'Preço pago (R$)'}
          <input type="number" min="0.01" step="0.01" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </label>
      </div>
      <label>Data
        <input type="date" value={data} max={hoje()} onChange={(e) => setData(e.target.value)} />
      </label>
      <p className="nota">Total: <strong>{reais(Number(quantidade) * Number(preco) || 0)}</strong></p>
      {erro && <p className="aviso aviso-venda">{erro}</p>}
      <div className="linha-botoes">
        <button type="button" className="botao-secundario" onClick={aoCancelar}>Cancelar</button>
        <button type="submit" className={venda ? 'botao-perigo' : 'botao-primario'} disabled={salvando}>
          {salvando ? 'Salvando…' : venda ? 'Salvar Venda' : 'Salvar Compra'}
        </button>
      </div>
    </form>
  );
}

export function Carteira({ sinal }) {
  const c = useCarteira(sinal);
  const [form, setForm] = useState(null); // 'compra' | 'venda' | null
  const [verAnotacoes, setVerAnotacoes] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const stopPct = sinal.parametros.stop_pct;

  if (c.erro) return <p className="aviso aviso-venda">Não foi possível carregar a carteira: {c.erro}</p>;
  if (c.carregando) return <p className="carregando">Carregando carteira…</p>;

  const total = resumir(c.posicoes);
  const fechar = () => { setForm(null); c.recarregar(); };

  return (
    <section>
      <div className="titulo-secao">
        <h2>Minha carteira</h2>
        <p>Suas anotações de compra e venda, o resultado de cada ação e o stop móvel.</p>
      </div>

      {c.posicoes.length > 0 && (
        <div className="resumo">
          <div><span className="rotulo">Valor em ações</span><strong>{reais(total.valor)}</strong></div>
          <div><span className="rotulo">Investido</span><strong>{reais(total.investido)}</strong></div>
          <div>
            <span className="rotulo">Lucro em aberto</span>
            <strong className={total.lucro >= 0 ? 'texto-verde' : 'texto-vermelho'}>
              {reais(total.lucro)} ({total.lucro >= 0 ? '+' : ''}{pct(total.lucroPct)})
            </strong>
          </div>
          {c.lucroRealizado !== 0 && (
            <div>
              <span className="rotulo">Lucro já realizado</span>
              <strong className={c.lucroRealizado >= 0 ? 'texto-verde' : 'texto-vermelho'}>{reais(c.lucroRealizado)}</strong>
            </div>
          )}
        </div>
      )}

      {form ? (
        <FormularioAnotacao tipo={form} sinal={sinal} posicoes={c.posicoes} aoSalvar={fechar} aoCancelar={() => setForm(null)} />
      ) : (
        <div className="linha-botoes linha-botoes-cheia">
          <button className="botao-primario" onClick={() => setForm('compra')}>+ Anotar Compra</button>
          {c.posicoes.length > 0 && <button className="botao-perigo-leve" onClick={() => setForm('venda')}>− Anotar Venda</button>}
        </div>
      )}

      {c.posicoes.length === 0 ? (
        <p className="vazio">Nenhuma ação anotada. Use o simulador da tela Início ou anote uma compra acima.</p>
      ) : (
        <>
          <h3 className="subtitulo">Posições</h3>
          {c.posicoes.map((p) => {
            const cor = p.lucro >= 0 ? 'texto-verde' : 'texto-vermelho';
            const bateu = p.precoAtual <= p.stopMovel;
            const folga = p.precoAtual / p.stopMovel - 1;
            return (
              <article key={p.ticker} className={`cartao-posicao ${bateu ? 'posicao-alerta' : ''}`}>
                <header>
                  <div>
                    <h3>{p.ticker}</h3>
                    <p>{p.quantidade} ações · {nomeSetor(p.setor)} · desde {dataBR(p.inicio)}</p>
                  </div>
                  <strong className={cor}>{p.lucro >= 0 ? '+' : ''}{pct(p.lucroPct)}</strong>
                </header>
                <div className="cartao-numeros">
                  <div><span className="rotulo">Preço médio</span><strong>{reais(p.precoMedio)}</strong></div>
                  <div><span className="rotulo">Preço atual</span><strong>{p.semCotacao ? '—' : reais(p.precoAtual)}</strong></div>
                  <div><span className="rotulo">Lucro</span><strong className={cor}>{reais(p.lucro)}</strong></div>
                </div>
                <p className={`stop-linha ${bateu ? 'texto-vermelho' : ''}`}>
                  🛑 Stop móvel ({pct(stopPct)} abaixo do topo de {reais(p.topo)}): <strong>{reais(p.stopMovel)}</strong>
                  {bateu ? ' · BATEU, hora de vender' : ` · folga de ${pct(folga)}`}
                </p>
              </article>
            );
          })}
        </>
      )}

      {c.aportes.length > 0 && (
        <>
          <button className="botao-link" onClick={() => setVerAnotacoes(!verAnotacoes)}>
            {verAnotacoes ? 'Esconder minhas anotações' : `Ver minhas anotações (${c.aportes.length})`}
          </button>
          {verAnotacoes && (
            <ul className="lista-anotacoes">
              {[...c.aportes].reverse().map((a) => (
                <li key={a.id}>
                  <span className={a.tipo === 'venda' ? 'texto-vermelho' : 'texto-verde'}>{a.tipo === 'venda' ? 'Venda' : 'Compra'}</span>
                  <span>{dataBR(a.data)} · {a.quantidade} {a.ticker} a {reais(a.precoUnitario)}</span>
                  <button className="botao-mini" onClick={async () => { await apagarAporte(a.id); c.recarregar(); }}>Apagar anotação</button>
                </li>
              ))}
            </ul>
          )}

          {confirmarApagar ? (
            <div className="confirmar">
              <p>Isso apaga <strong>todas</strong> as anotações de compra e venda. Não dá para desfazer.</p>
              <div className="linha-botoes">
                <button className="botao-secundario" onClick={() => setConfirmarApagar(false)}>Manter minhas anotações</button>
                <button className="botao-perigo" onClick={async () => { await apagarAportes(); setConfirmarApagar(false); c.recarregar(); }}>Sim, apagar tudo</button>
              </div>
            </div>
          ) : (
            <button className="botao-perigo-leve largo" onClick={() => setConfirmarApagar(true)}>Apagar Histórico da Carteira</button>
          )}
        </>
      )}
    </section>
  );
}
