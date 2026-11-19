import { useEffect, useRef, useState } from 'react';
import { perguntarAthena } from '../dados/index.js';

const SUGESTOES = [
  'Por que a 1ª do Top 5 foi escolhida?',
  'Alguma ação da minha carteira está perto do stop?',
  'Meu colchão está equilibrado?',
  'Tem alguma notícia preocupante hoje?',
];

/** Botão flutuante + janela de conversa do "Athena Explica". */
export function Chat() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]); // { role: 'user' | 'assistant', content }
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const [erro, setErro] = useState('');
  const [restantes, setRestantes] = useState(null);
  const fim = useRef(null);

  useEffect(() => { fim.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens, pensando]);

  async function enviar(pergunta) {
    const p = pergunta.trim();
    if (!p || pensando) return;
    setErro('');
    setTexto('');
    const historico = mensagens;
    setMensagens([...historico, { role: 'user', content: p }]);
    setPensando(true);
    try {
      const r = await perguntarAthena(p, historico);
      setMensagens((m) => [...m, { role: 'assistant', content: r.resposta }]);
      if (r.restantes != null) setRestantes(r.restantes);
    } catch (e) {
      setErro(e.message);
      setMensagens(historico); // devolve a pergunta para o campo, para tentar de novo
      setTexto(p);
    }
    setPensando(false);
  }

  if (!aberto) {
    return (
      <button className="chat-botao" onClick={() => setAberto(true)} aria-label="Abrir o Athena Explica">
        <span aria-hidden>✦</span> Pergunte ao Athena
      </button>
    );
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Athena Explica" onClick={() => setAberto(false)}>
      <div className="modal-caixa chat" onClick={(e) => e.stopPropagation()}>
        <div className="modal-topo">
          <h2>Athena Explica</h2>
          <button className="botao-secundario" onClick={() => setAberto(false)}>Fechar conversa</button>
        </div>
        <p className="nota">Pergunte sobre o Top 5, as notícias, a sua carteira ou o seu colchão. A IA explica com os dados do Athena, mas não recomenda compras nem prevê preços.</p>

        <div className="chat-mensagens">
          {mensagens.length === 0 && (
            <div className="sugestoes">
              {SUGESTOES.map((s) => <button key={s} className="chip-sugestao" onClick={() => enviar(s)}>{s}</button>)}
            </div>
          )}
          {mensagens.map((m, i) => (
            <p key={i} className={`balao balao-${m.role === 'user' ? 'usuario' : 'athena'}`}>{m.content}</p>
          ))}
          {pensando && <p className="balao balao-athena carregando-texto">Analisando os dados…</p>}
          <div ref={fim} />
        </div>

        {erro && <p className="aviso aviso-atencao">⚠️ {erro}</p>}
        <form className="chat-entrada" onSubmit={(e) => { e.preventDefault(); enviar(texto); }}>
          <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={600}
            placeholder="Escreva sua pergunta…" aria-label="Sua pergunta" disabled={pensando} />
          <button className="botao-primario" disabled={pensando || !texto.trim()}>Enviar pergunta</button>
        </form>
        {restantes != null && <p className="nota">Você ainda pode fazer {restantes} perguntas hoje.</p>}
      </div>
    </div>
  );
}
