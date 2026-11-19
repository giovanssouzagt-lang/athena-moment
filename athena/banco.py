"""
Envio do sinal para o Supabase, usando a API REST dele (sem biblioteca extra).

Precisa de duas variáveis de ambiente:
  SUPABASE_URL          ex.: https://abcdefgh.supabase.co
  SUPABASE_SERVICE_KEY  a chave secreta "service_role" (NUNCA no código nem no app)

Localmente, elas podem ficar num arquivo .env na raiz (ignorado pelo git).
No GitHub, ficam nos "Secrets" do repositório.
"""
import os
from pathlib import Path

import requests

from .universo import TICKERS, get_empresa, get_nome, get_setor, is_escassez, sem_sufixo


def _carregar_env():
    env = Path(__file__).resolve().parent.parent / ".env"
    if env.exists():
        for linha in env.read_text(encoding="utf-8").splitlines():
            if "=" in linha and not linha.strip().startswith("#"):
                chave, valor = linha.split("=", 1)
                os.environ.setdefault(chave.strip(), valor.strip().strip('"'))


def _upsert(url, chave, tabela, linhas):
    resposta = requests.post(
        f"{url}/rest/v1/{tabela}",
        json=linhas,
        headers={
            "apikey": chave,
            "Authorization": f"Bearer {chave}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        timeout=60,
    )
    if resposta.status_code >= 300:
        raise RuntimeError(f"Supabase recusou o envio para '{tabela}': {resposta.status_code} {resposta.text}")


def _credenciais():
    _carregar_env()
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    chave = os.environ.get("SUPABASE_SERVICE_KEY", "")
    return (url, chave) if url and chave else (None, None)


def _ler(tabela, consulta):
    url, chave = _credenciais()
    if not url:
        return []
    r = requests.get(f"{url}/rest/v1/{tabela}?{consulta}",
                     headers={"apikey": chave, "Authorization": f"Bearer {chave}"}, timeout=60)
    if r.status_code >= 300:
        raise RuntimeError(f"Supabase recusou a leitura de '{tabela}': {r.status_code} {r.text}")
    return r.json()


def tickers_em_carteiras():
    """Ações anotadas em alguma carteira (só os códigos), para buscar notícias delas."""
    return sorted({linha["ticker"] for linha in _ler("aportes", "select=ticker")})


def sinais_desde(data):
    return [l["conteudo"] for l in _ler("sinais", f"select=conteudo&data=gte.{data}&order=data.asc")]


def ia_conteudo_desde(tipo, data):
    return [l["conteudo"] for l in _ler("ia_conteudo", f"select=conteudo&tipo=eq.{tipo}&data=gte.{data}&order=data.asc")]


def enviar_ia(tipo, data, conteudo):
    url, chave = _credenciais()
    if not url:
        return
    _upsert(url, chave, "ia_conteudo", [{"data": data, "tipo": tipo, "conteudo": conteudo}])
    print(f"Conteúdo de IA '{tipo}' de {data} enviado ao Supabase.")


def enviar_sinal(sinal, precos=None):
    _carregar_env()
    url = os.environ.get("SUPABASE_URL", "").rstrip("/")
    chave = os.environ.get("SUPABASE_SERVICE_KEY", "")
    if not url or not chave:
        print("\n(Supabase não configurado: sinal salvo só em saida/)")
        return

    _upsert(url, chave, "ativos", [
        {"ticker": sem_sufixo(t), "nome": get_nome(t), "setor": get_setor(t),
         "escassez": is_escassez(t), "empresa_canonica": sem_sufixo(get_empresa(t))}
        for t in TICKERS
    ])
    _upsert(url, chave, "sinais", [
        {"data": sinal["data"], "tickers": [a["ticker"] for a in sinal["top"]], "conteudo": sinal}
    ])
    if precos:
        # em blocos, para não mandar ~19 mil linhas de uma vez
        for i in range(0, len(precos), 2000):
            _upsert(url, chave, "precos", precos[i:i + 2000])
    print(f"\nSinal de {sinal['data']} enviado ao Supabase"
          + (f" (+ {len(precos)} fechamentos para o stop móvel)." if precos else "."))
