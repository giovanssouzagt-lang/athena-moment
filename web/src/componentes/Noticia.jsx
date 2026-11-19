import { useState } from 'react';

const ROTULO = { alto: '🔴 Notícia de risco', atencao: '⚠️ Notícia para acompanhar', nenhum: '📰 Notícias' };

/** Resumo das notícias de uma ação, feito pela IA, com as fontes. */
export function NoticiaAcao({ noticia }) {
  const [aberta, setAberta] = useState(noticia.risco !== 'nenhum');
  return (
    <div className={`noticia noticia-${noticia.risco}`}>
      <button className="noticia-topo" onClick={() => setAberta(!aberta)} aria-expanded={aberta}>
        <span>{ROTULO[noticia.risco]}</span>
        <span className="noticia-seta">{aberta ? '▲' : '▼'}</span>
      </button>
      {aberta && (
        <div className="noticia-corpo">
          {noticia.motivo && <p><strong>{noticia.motivo}</strong></p>}
          <p>{noticia.resumo}</p>
          {noticia.fontes?.length > 0 && (
            <ul>
              {noticia.fontes.map((f, i) => (
                <li key={i}><a href={f.link} target="_blank" rel="noopener noreferrer">{f.fonte || 'Fonte'}: {f.titulo}</a></li>
              ))}
            </ul>
          )}
          <p className="nota">Resumo feito por IA a partir de manchetes. Confira a fonte antes de decidir.</p>
        </div>
      )}
    </div>
  );
}
