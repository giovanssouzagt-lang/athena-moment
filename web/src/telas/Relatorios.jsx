import { useEffect, useState } from 'react';
import { listarRelatorios } from '../dados/index.js';

function Lista({ titulo, itens }) {
  if (!itens?.length) return null;
  return (
    <>
      <h4>{titulo}</h4>
      <ul>{itens.map((t, i) => <li key={i}>{t}</li>)}</ul>
    </>
  );
}

/** Relatórios semanais escritos pela IA (aparecem no topo do Histórico). */
export function Relatorios() {
  const [relatorios, setRelatorios] = useState(null);
  const [aberto, setAberto] = useState(0);

  useEffect(() => { listarRelatorios().then(setRelatorios).catch(() => setRelatorios([])); }, []);

  if (!relatorios?.length) return null;
  return (
    <div className="relatorios">
      <h3 className="subtitulo">Relatórios semanais</h3>
      {relatorios.map((r, i) => (
        <article key={r.data} className="painel relatorio">
          <button className="relatorio-topo" onClick={() => setAberto(aberto === i ? -1 : i)} aria-expanded={aberto === i}>
            <span>
              <strong>{r.titulo}</strong>
              <small>Semana {r.semana}</small>
            </span>
            <span>{aberto === i ? '▲' : '▼'}</span>
          </button>
          {aberto === i && (
            <div className="relatorio-corpo">
              <p>{r.resumo}</p>
              <Lista titulo="Mudanças no Top 5" itens={r.mudancas_top5} />
              <Lista titulo="Destaques" itens={r.destaques} />
              <Lista titulo="Riscos" itens={r.riscos} />
              <Lista titulo="Para a próxima semana" itens={r.proxima_semana} />
              <p className="nota">Escrito por IA com os sinais e as notícias da semana. Não é recomendação de investimento.</p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
