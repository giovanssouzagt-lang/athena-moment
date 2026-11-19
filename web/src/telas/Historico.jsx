import { useEffect, useState } from 'react';
import { listarHistorico, obterSinal } from '../dados/index.js';
import { nomeSetor, pct } from '../carteira.js';
import { CartaoAcao } from './Top5.jsx';
import { Relatorios } from './Relatorios.jsx';

export const dataBR = (d) => d.split('-').reverse().join('/');

export function Historico() {
  const [dias, setDias] = useState(null);
  const [erro, setErro] = useState('');
  const [detalhe, setDetalhe] = useState(null);

  useEffect(() => {
    listarHistorico().then(setDias).catch((e) => setErro(e.message));
  }, []);

  async function abrir(data) {
    setDetalhe({ carregando: true, data });
    try {
      setDetalhe({ data, sinal: await obterSinal(data) });
    } catch (e) {
      setDetalhe({ data, erro: e.message });
    }
  }

  if (erro) return <p className="aviso aviso-venda">Não foi possível carregar o histórico: {erro}</p>;
  if (!dias) return <p className="carregando">Carregando histórico…</p>;

  return (
    <section>
      <div className="titulo-secao">
        <h2>Histórico de sinais</h2>
        <p>O que o Athena recomendou em cada dia.</p>
      </div>

      <Relatorios />

      <ul className="lista-historico">
        {dias.map((d) => (
          <li key={d.data}>
            <div>
              <strong>{dataBR(d.data)}</strong>
              <div className="chips">{d.tickers.map((t) => <span key={t} className="chip">{t}</span>)}</div>
            </div>
            <button className="botao-secundario" onClick={() => abrir(d.data)}>Ver detalhes do dia</button>
          </li>
        ))}
      </ul>

      {detalhe && (
        <div className="modal" role="dialog" aria-modal="true" onClick={() => setDetalhe(null)}>
          <div className="modal-caixa" onClick={(e) => e.stopPropagation()}>
            <div className="modal-topo">
              <h2>Sinal de {dataBR(detalhe.data)}</h2>
              <button className="botao-secundario" onClick={() => setDetalhe(null)}>Fechar detalhes</button>
            </div>
            {detalhe.carregando && <p className="carregando">Carregando…</p>}
            {detalhe.erro && <p className="aviso aviso-venda">{detalhe.erro}</p>}
            {detalhe.sinal && (
              <>
                {detalhe.sinal.top.map((a) => <CartaoAcao key={a.ticker} acao={a} />)}
                <h3 className="subtitulo">Ranking de força do dia (15 primeiras)</h3>
                <table className="tabela">
                  <thead><tr><th>#</th><th>Ação</th><th>Setor</th><th>Força</th><th></th></tr></thead>
                  <tbody>
                    {detalhe.sinal.ranking.map((r, i) => (
                      <tr key={r.ticker} className={r.selecionada ? 'linha-selecionada' : ''}>
                        <td>{i + 1}</td>
                        <td>{r.ticker}{r.escassez && <span className="ponto-ouro" title="Escassez" />}</td>
                        <td>{nomeSetor(r.setor)}</td>
                        <td className="texto-verde">+{pct(r.momentum)}</td>
                        <td>{r.selecionada ? 'Top 5' : r.esticada ? 'Esticada' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="nota">Uma ação forte pode ficar de fora do Top 5 pelo limite de 2 por setor, porque a mesma empresa já entrou ou por estar "esticada" (mais de 8% acima da média de 50 dias). As de escassez (ponto dourado) têm prioridade.</p>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
