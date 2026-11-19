import { useState } from 'react';
import { cadastrar, entrar } from '../dados/index.js';

export function Login() {
  const [modo, setModo] = useState('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setEnviando(true);
    setMsg(null);
    try {
      if (modo === 'entrar') await entrar(email, senha);
      else {
        await cadastrar(email, senha);
        setMsg({ tipo: 'ok', texto: 'Conta criada! Enviamos um link de confirmação para o seu e-mail. Confirme e depois entre.' });
        setModo('entrar');
      }
    } catch (err) {
      setMsg({ tipo: 'venda', texto: err.message });
    }
    setEnviando(false);
  }

  return (
    <main className="login">
      <img src={`${import.meta.env.BASE_URL}icones/icone-512.png`} alt="Athena Moment" className="login-logo" />
      <p className="login-frase">Disciplina, dados e proteção para investir com método.</p>
      <form className="formulario" onSubmit={enviar}>
        <label>E-mail
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Senha
          <input type="password" autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} required minLength={6}
            value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        {msg && <p className={`aviso aviso-${msg.tipo}`}>{msg.texto}</p>}
        <button className="botao-primario largo" disabled={enviando}>
          {enviando ? 'Aguarde…' : modo === 'entrar' ? 'Entrar na minha conta' : 'Criar minha conta'}
        </button>
      </form>
      <button className="botao-link" onClick={() => { setModo(modo === 'entrar' ? 'cadastrar' : 'entrar'); setMsg(null); }}>
        {modo === 'entrar' ? 'Ainda não tem conta? Criar conta grátis' : 'Já tem conta? Entrar'}
      </button>
    </main>
  );
}
