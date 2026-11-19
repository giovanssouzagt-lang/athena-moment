import { useEffect, useState } from 'react';
import { aoMudarSessao, modoDemo, obterSinalAtual, sair, sessaoAtual } from './dados/index.js';
import { IconeCarteira, IconeComparativo, IconeHistorico, IconeSair, IconeTop } from './componentes/Icones.jsx';
import { Top5 } from './telas/Top5.jsx';
import { Historico, dataBR } from './telas/Historico.jsx';
import { Carteira } from './telas/Carteira.jsx';
import { Comparativo } from './telas/Comparativo.jsx';
import { Login } from './telas/Login.jsx';

const ABAS = [
  { id: 'top', nome: 'Top 5', Icone: IconeTop },
  { id: 'historico', nome: 'Histórico', Icone: IconeHistorico },
  { id: 'carteira', nome: 'Carteira', Icone: IconeCarteira },
  { id: 'comparativo', nome: 'BOVA11', Icone: IconeComparativo },
];

export function App() {
  const [usuario, setUsuario] = useState(undefined); // undefined = verificando
  const [sinal, setSinal] = useState(null);
  const [erro, setErro] = useState('');
  const [aba, setAba] = useState('top');

  useEffect(() => {
    sessaoAtual().then(setUsuario);
    return aoMudarSessao(setUsuario);
  }, []);

  useEffect(() => {
    if (usuario) obterSinalAtual().then(setSinal).catch((e) => setErro(e.message));
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
        {sinal && aba === 'top' && <Top5 sinal={sinal} />}
        {sinal && aba === 'historico' && <Historico />}
        {sinal && aba === 'carteira' && <Carteira sinal={sinal} />}
        {sinal && aba === 'comparativo' && <Comparativo sinal={sinal} />}
        <footer className="rodape">
          Ferramenta de triagem, não é recomendação de investimento. Resultados passados não garantem resultados futuros. A decisão final é sempre sua.
        </footer>
      </main>

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
