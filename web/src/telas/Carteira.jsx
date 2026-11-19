import { useEffect, useMemo, useState } from 'react';
import { adicionarAporte, apagarAportes, listarAportes } from '../dados/index.js';
import { gerarAlertas, montarPosicoes, nomeSetor, pct, reais, resumir } from '../carteira.js';

const LIMITE_SETOR = 0.4;
const hoje = () => new Date().toISOString().slice(0, 10);
const ICONE_ALERTA = { venda: '🔴', atencao: '⚠️', compra: '🟢', ok: '✅' };

function FormularioCompra({ cotacoes, aoSalvar, aoCancelar }) {
  const tickers = Object.keys(cotacoes).sort();
  const [ticker, setTicker] = useState(tickers[0]);
  const [quantidade, setQuantidade] = useState(100);
  const [preco, setPreco] = useState(cotacoes[tickers[0]]?.preco ?? 0);
  const [data, setData] = useState(hoje());
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  function trocarAcao(t) {
    setTicker(t);
    setPreco(cotacoes[t]?.preco ?? 0);
  }

  async function salvar(e) {
    e.preventDefault();
    if (quantidade <= 0 || preco <= 0) return setErro('Quantidade e preço precisam ser maiores que zero.');
    setSalvando(true);
    try {
      await adicionarAporte({ ticker, data, quantidade: Number(quantidade), precoUnitario: Number(preco) });
      aoSalvar();
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  return (
    <form className="formulario" onSubmit={salvar}>
      <label>Ação
        <select value={ticker} onChange={(e) => trocarAcao(e.target.value)}>
          {tickers.map((t) => <option key={t} value={t}>{t} · {cotacoes[t].nome}</option>)}
        </select>
      </label>
      <div className="linha-campos">
        <label>Quantidade
          <input type="number" min="1" step="1" inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </label>
        <label>Preço pago (R$)
          <input type="number" min="0.01" step="0.01" inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </label>
      </div>
      <label>Data da compra
        <input type="date" value={data} max={hoje()} onChange={(e) => setData(e.target.value)} />
      </label>
      <p className="nota">Total desta compra: <strong>{reais(Number(quantidade) * Number(preco) || 0)}</strong></p>
      {erro && <p className="aviso aviso-venda">{erro}</p>}
      <div className="linha-botoes">
        <button type="button" className="botao-secundario" onClick={aoCancelar}>Cancelar compra</button>
        <button type="submit" className="botao-primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar Compra'}</button>
      </div>
    </form>
  );
}

export function Carteira({ sinal }) {
  const [aportes, setAportes] = useState(null);
  const [formAberto, setFormAberto] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [erro, setErro] = useState('');

  const recarregar = () => listarAportes().then(setAportes).catch((e) => setErro(e.message));
  useEffect(() => { recarregar(); }, []);

  const posicoes = useMemo(() => (aportes ? montarPosicoes(aportes, sinal.cotacoes) : []), [aportes, sinal]);
  const total = resumir(posicoes);
  const alertas = gerarAlertas(posicoes, sinal.top, { stopPct: sinal.parametros.stop_pct, limiteSetor: LIMITE_SETOR });

  async function apagar() {
    await apagarAportes();
    setConfirmarApagar(false);
    recarregar();
  }

  if (erro) return <p className="aviso aviso-venda">Não foi possível carregar a carteira: {erro}</p>;
  if (!aportes) return <p className="carregando">Carregando carteira…</p>;

  return (
    <section>
      <div className="titulo-secao">
        <h2>Minha carteira</h2>
        <p>Suas compras, o resultado de cada uma e o que fazer.</p>
      </div>

      {posicoes.length > 0 && (
        <div className="resumo">
          <div><span className="rotulo">Valor atual</span><strong>{reais(total.valor)}</strong></div>
          <div><span className="rotulo">Investido</span><strong>{reais(total.investido)}</strong></div>
          <div>
            <span className="rotulo">Lucro / prejuízo</span>
            <strong className={total.lucro >= 0 ? 'texto-verde' : 'texto-vermelho'}>
              {reais(total.lucro)} ({total.lucro >= 0 ? '+' : ''}{pct(total.lucroPct)})
            </strong>
          </div>
        </div>
      )}

      {formAberto ? (
        <FormularioCompra cotacoes={sinal.cotacoes} aoCancelar={() => setFormAberto(false)}
          aoSalvar={() => { setFormAberto(false); recarregar(); }} />
      ) : (
        <button className="botao-primario largo" onClick={() => setFormAberto(true)}>+ Adicionar Nova Compra</button>
      )}

      {alertas.length > 0 && (
        <div className="alertas">
          <h3 className="subtitulo">O que fazer hoje</h3>
          {alertas.map((a, i) => (
            <p key={i} className={`aviso aviso-${a.tipo}`}><span aria-hidden>{ICONE_ALERTA[a.tipo]}</span> {a.texto}</p>
          ))}
        </div>
      )}

      {posicoes.length === 0 ? (
        <p className="vazio">Sua carteira está vazia. Registre sua primeira compra para acompanhar lucro, stop e alertas.</p>
      ) : (
        <>
          <h3 className="subtitulo">Posições</h3>
          <div className="tabela-rolagem">
            <table className="tabela">
              <thead>
                <tr><th>Ação</th><th>Qtd</th><th>Preço médio</th><th>Preço atual</th><th>Lucro (R$)</th><th>Lucro (%)</th></tr>
              </thead>
              <tbody>
                {posicoes.map((p) => {
                  const cor = p.lucro >= 0 ? 'texto-verde' : 'texto-vermelho';
                  return (
                    <tr key={p.ticker}>
                      <td><strong>{p.ticker}</strong><small>{nomeSetor(p.setor)}</small></td>
                      <td>{p.quantidade}</td>
                      <td>{reais(p.precoMedio)}</td>
                      <td>{p.semCotacao ? '—' : reais(p.precoAtual)}</td>
                      <td className={cor}>{reais(p.lucro)}</td>
                      <td className={cor}>{p.lucro >= 0 ? '+' : ''}{pct(p.lucroPct)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {confirmarApagar ? (
            <div className="confirmar">
              <p>Isso apaga <strong>todas</strong> as compras registradas. Não dá para desfazer.</p>
              <div className="linha-botoes">
                <button className="botao-secundario" onClick={() => setConfirmarApagar(false)}>Manter minha carteira</button>
                <button className="botao-perigo" onClick={apagar}>Sim, apagar tudo</button>
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
