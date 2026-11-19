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


def enviar_sinal(sinal):
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
    print(f"\nSinal de {sinal['data']} enviado ao Supabase.")
