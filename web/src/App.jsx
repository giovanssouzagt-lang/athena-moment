import { useEffect, useState } from 'react';
import { aoMudarSessao, modoDemo, obterNoticias, obterSinalAtual, sair, sessaoAtual } from './dados/index.js';
import { IconeCarteira, IconeColchao, IconeHistorico, IconeInicio, IconeSair, IconeTop } from './componentes/Icones.jsx';
import { Top5 } from './telas/Top5.jsx';
import { Historico, dataBR } from './telas/Historico.jsx';
import { Carteira } from './telas/Carteira.jsx';
import { Inicio } from './telas/Inicio.jsx';
import { Colchao } from './telas/Colchao.jsx';
import { Login } from './telas/Login.jsx';
import { Chat } from './telas/Chat.jsx';

const ABAS = [
  { id: 'inicio', nome: 'Início', Icone: IconeInicio },
  { id: 'top', nome: 'Top 5', Icone: IconeTop },
  { id: 'carteira', nome: 'Carteira', Icone: IconeCarteira },
  { id: 'colchao', nome: 'Colchão', Icone: IconeColchao },
  { id: 'historico', nome: 'Histórico', Icone: IconeHistorico },
];

export function App() {
  const [usuario, setUsuario] = useState(undefined); // undefined = verificando
  const [sinal, setSinal] = useState(null);
  const [noticias, setNoticias] = useState(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('inicio');

  useEffect(() => {
    sessaoAtual().then(setUsuario);
    return aoMudarSessao(setUsuario);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    obterSinalAtual().then(setSinal).catch((e) => setErro(e.message));
    obterNoticias().then(setNoticias).catch(() => setNoticias(null)); // complemento: sem notícias o app funciona igual
  }, [usuario]);

  if (usuario === undefined) return <p className="carregando tela-cheia">Abrindo o Athena…</p>;
  if (!usuario) return <Login />;

  return (
    <div className="app">
      <header className="cabecalho">
        <img src={`${import.meta.env.BASE_URL}icones/simbolo.png`} alt="" className="cabecalho-simbolo" />
        <div className="marca">
          <span className="marca-nome">Athena</span>
          <span className="marca-sub">MOMENT</span>
        </div>
        <div className="cabecalho-direita">
          {sinal && <span className="data-sinal">Sinal de {dataBR(sinal.data)}</span>}
          {!modoDemo && (
            <button className="botao-sair" onClick={sair} title={`Sair da conta ${usuario.email}`}>
              <IconeSair /> Sair
            </button>
          )}
        </div>
      </header>

      {modoDemo && <p className="faixa-demo">Modo demonstração: dados de exemplo e carteira salva só neste aparelho.</p>}

      <main className="conteudo">
        {erro && <p className="aviso aviso-venda">{erro}</p>}
        {!sinal && !erro && <p className="carregando">Buscando o sinal de hoje…</p>}
        {sinal && aba === 'inicio' && <Inicio sinal={sinal} noticias={noticias} />}
        {sinal && aba === 'top' && <Top5 sinal={sinal} noticias={noticias} />}
        {sinal && aba === 'carteira' && <Carteira sinal={sinal} />}
        {sinal && aba === 'colchao' && <Colchao sinal={sinal} />}
        {sinal && aba === 'historico' && <Historico />}
        <footer className="rodape">
          Ferramenta de triagem, não é recomendação de investimento. Resultados passados não garantem resultados futuros. A decisão final é sempre sua.
        </footer>
      </main>

      {sinal && <Chat />}

      <nav className="menu-inferior" aria-label="Seções">
        {ABAS.map(({ id, nome, Icone }) => (
          <button key={id} className={aba === id ? 'ativo' : ''} onClick={() => { setAba(id); window.scrollTo(0, 0); }}
            aria-current={aba === id ? 'page' : undefined}>
            <Icone />
            <span>{nome}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
