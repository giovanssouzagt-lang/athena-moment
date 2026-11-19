"""
ROBÔ DIÁRIO DO ATHENA
=====================
Baixa os preços, roda a estratégia e salva o sinal do dia.
- Sempre salva em saida/ultimo_sinal.json (e uma cópia com a data).
- Se as chaves do Supabase estiverem configuradas, também envia para o banco.

Rode com:  python gerar_sinal.py
"""
import json
import sys
from pathlib import Path

import yfinance as yf

from athena import config
from athena.dados import baixar_precos
from athena.sinal import gerar_sinal
from athena.universo import TICKERS, sem_sufixo

SAIDA = Path(__file__).parent / "saida"


def baixar_benchmark():
    try:
        dados = baixar_precos([config.BENCHMARK], minimo=50)
        return dados.get(config.BENCHMARK)
    except Exception as erro:  # o comparativo é opcional: não derruba o robô
        print(f"  aviso: BOVA11 indisponível ({erro})")
        return None


def main():
    print("Athena: baixando preços...")
    dados = baixar_precos(TICKERS)
    print(f"  {len(dados)} de {len(TICKERS)} ações com histórico suficiente")
    if len(dados) < len(TICKERS) * 0.8:
        # Proteção: com poucos dados o ranking ficaria distorcido
        print("ERRO: menos de 80% das ações foram baixadas. Sinal NÃO gerado.")
        sys.exit(1)

    sinal = gerar_sinal(dados, baixar_benchmark())

    SAIDA.mkdir(exist_ok=True)
    texto = json.dumps(sinal, ensure_ascii=False, indent=1)
    (SAIDA / "ultimo_sinal.json").write_text(texto, encoding="utf-8")
    (SAIDA / f"sinal_{sinal['data']}.json").write_text(texto, encoding="utf-8")

    print(f"\nTop {config.TOP_N} de {sinal['data']}:")
    for a in sinal["top"]:
        selo = " [escassez]" if a["escassez"] else ""
        print(f"  {a['posicao']}. {a['ticker']:<7} {a['setor']:<11} mom {a['momentum']:+.1%}  "
              f"R$ {a['preco']:>8.2f}  stop R$ {a['stop']:>8.2f}{selo}")
    c = sinal["comparativo"]
    if c:
        print(f"\n12 meses: Top 5 {c['retorno_top5']:+.1%} | BOVA11 {c['retorno_bova']:+.1%}")

    try:
        from athena.banco import enviar_sinal  # noqa: E402
        enviar_sinal(sinal)
    except ImportError:
        pass


if __name__ == "__main__":
    main()
