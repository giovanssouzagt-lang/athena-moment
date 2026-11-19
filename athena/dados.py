"""
Busca de preços no Yahoo Finance.

Melhoria em relação ao script original: baixa as 75 ações numa chamada só
(em vez de 75 chamadas seguidas), o que é bem mais rápido. Depois separa
cada ação e remove as linhas vazias dela, para que cada série fique
exatamente igual à do download individual.
"""
from datetime import datetime

import pandas as pd
import yfinance as yf

from . import config

COLUNAS = ["Open", "High", "Low", "Close", "Volume"]


def baixar_precos(tickers, dias=config.DIAS_DOWNLOAD, minimo=config.LOOKBACK + 30):
    hoje = datetime.today()
    inicio = (hoje - pd.Timedelta(days=dias)).strftime("%Y-%m-%d")
    # O Yahoo trata o "fim" como exclusivo. O script original usava "hoje",
    # o que ignorava o pregão do dia. Como o robô roda depois do fechamento
    # (18h30), pedimos até amanhã para incluir o fechamento de hoje.
    fim = (hoje + pd.Timedelta(days=1)).strftime("%Y-%m-%d")
    bruto = yf.download(
        list(tickers), start=inicio, end=fim, auto_adjust=True,
        progress=False, group_by="ticker", threads=True,
    )
    dados = {}
    for t in tickers:
        try:
            df = bruto[t] if isinstance(bruto.columns, pd.MultiIndex) else bruto
        except KeyError:
            continue
        df = df[COLUNAS].dropna()
        if len(df) < minimo:
            continue
        dados[t] = df
    return dados
