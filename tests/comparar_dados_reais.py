"""
Compara, com dados REAIS de hoje, o download novo (75 ações de uma vez)
com o download original (uma ação por vez) e o Top 5 resultante.
Precisa de internet. Rode com: python tests/comparar_dados_reais.py
"""
import sys, time
from datetime import datetime
from pathlib import Path

import pandas as pd
import yfinance as yf

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))
import referencia_athena_final as ref
from athena.dados import baixar_precos
from athena.estrategia import calcular_momentum, selecionar_top


def baixar_como_original(tickers, dias=600):
    fim = datetime.today()
    inicio = (fim - pd.Timedelta(days=dias)).strftime("%Y-%m-%d")
    dados = {}
    for t in tickers:
        df = yf.download(t, start=inicio, end=fim, auto_adjust=True, progress=False)
        if df.empty: continue
        if isinstance(df.columns, pd.MultiIndex): df.columns = df.columns.get_level_values(0)
        df = df[["Open", "High", "Low", "Close", "Volume"]].dropna()
        if len(df) < ref.LOOKBACK + 30: continue
        dados[t] = df
    return dados

t0 = time.time(); antigo = baixar_como_original(ref.TICKERS); t_antigo = time.time() - t0
t0 = time.time(); novo = baixar_precos(ref.TICKERS); t_novo = time.time() - t0
print(f"download original: {len(antigo)} acoes em {t_antigo:.1f}s")
print(f"download novo:     {len(novo)} acoes em {t_novo:.1f}s")

# O Yahoo arredonda o ajuste de dividendos de forma levemente diferente em cada
# chamada (diferencas de ~1e-7). Tolerancia: 0,001% do preco.
def iguais(a, b):
    return a.index.equals(b.index) and (((a - b).abs() / a).max() < 1e-5)

diferentes = [t for t in antigo if t not in novo or not iguais(antigo[t]["Close"], novo[t]["Close"])]
print("series de preco diferentes:", diferentes or "nenhuma")

top_antigo = ref.selecionar_top5(ref.calcular_momentum(antigo))
top_novo = selecionar_top(calcular_momentum(novo))
print("Top 5 original:", top_antigo)
print("Top 5 novo:    ", top_novo)
print("IGUAIS" if top_antigo == top_novo else "DIFERENTES")
