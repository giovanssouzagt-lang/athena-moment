"""
Monta o "sinal do dia": tudo o que o app precisa mostrar, num formato
simples (dicionário/JSON).
"""
from datetime import datetime, timezone

import pandas as pd

from . import config
from .estrategia import calcular_momentum, calcular_stop, selecionar_top
from .universo import get_nome, get_setor, is_escassez, sem_sufixo

DIAS_GRAFICO = 126  # ~6 meses de pregões
DIAS_COMPARATIVO = 252  # ~12 meses


def _serie(df, dias):
    s = df["Close"].iloc[-dias:]
    return [{"d": i.strftime("%Y-%m-%d"), "c": round(float(v), 4)} for i, v in s.items()]


def montar_comparativo(dados, top, benchmark_df, dias=DIAS_COMPARATIVO):
    """
    Como as ações escolhidas HOJE se comportaram nos últimos 12 meses, em
    pesos iguais, contra o BOVA11. Ambos começam em 100.
    Atenção: é um retrato do passado das escolhidas, não um backtest.
    """
    if not top or benchmark_df is None or benchmark_df.empty:
        return None
    closes = pd.concat({t: dados[t]["Close"] for t in top}, axis=1)
    closes["BOVA11"] = benchmark_df["Close"]
    closes = closes.dropna().iloc[-dias:]
    if len(closes) < 2:
        return None
    base = closes / closes.iloc[0] * 100
    carteira = base[top].mean(axis=1)
    bova = base["BOVA11"]
    return {
        "datas": [i.strftime("%Y-%m-%d") for i in base.index],
        "top5": [round(float(v), 2) for v in carteira],
        "bova": [round(float(v), 2) for v in bova],
        "retorno_top5": round(float(carteira.iloc[-1] / 100 - 1), 4),
        "retorno_bova": round(float(bova.iloc[-1] / 100 - 1), 4),
    }


def gerar_sinal(dados, benchmark_df=None, agora=None):
    agora = agora or datetime.now(timezone.utc)
    momentum = calcular_momentum(dados)
    top = selecionar_top(momentum)

    ranking = sorted(((t, m) for t, m in momentum.items() if m > 0), key=lambda x: -x[1])
    ultimo_pregao = max(df.index[-1] for df in dados.values())

    return {
        "data": ultimo_pregao.strftime("%Y-%m-%d"),
        "gerado_em": agora.isoformat(timespec="seconds"),
        "parametros": {
            "top_n": config.TOP_N, "stop_pct": config.STOP_PCT, "lookback": config.LOOKBACK,
            "exclude_last": config.EXCLUDE_LAST, "max_por_setor": config.MAX_POR_SETOR,
        },
        "top": [
            {
                "posicao": i,
                "ticker": sem_sufixo(t),
                "nome": get_nome(t),
                "setor": get_setor(t),
                "escassez": is_escassez(t),
                "momentum": round(float(momentum[t]), 4),
                "preco": round(float(dados[t]["Close"].iloc[-1]), 2),
                "stop": round(float(calcular_stop(dados[t]["Close"].iloc[-1])), 2),
                "serie": _serie(dados[t], DIAS_GRAFICO),
            }
            for i, t in enumerate(top, start=1)
        ],
        # os 15 primeiros do ranking, para o "Ver detalhes do dia"
        "ranking": [
            {"ticker": sem_sufixo(t), "momentum": round(float(m), 4), "selecionada": t in top,
             "setor": get_setor(t), "escassez": is_escassez(t)}
            for t, m in ranking[:15]
        ],
        "comparativo": montar_comparativo(dados, top, benchmark_df),
        # último preço de todas as ações, para calcular a carteira
        "cotacoes": {
            sem_sufixo(t): {
                "preco": round(float(df["Close"].iloc[-1]), 2),
                "nome": get_nome(t), "setor": get_setor(t), "escassez": is_escassez(t),
            }
            for t, df in dados.items()
        },
        "acoes_analisadas": len(dados),
    }
