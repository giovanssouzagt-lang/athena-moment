"""
Regras da estratégia Athena v26. Mesma lógica do athena_app.py v26:
os testes em tests/test_equivalencia.py comparam as versões.

1. Momentum = retorno de 252 pregões atrás até 21 pregões atrás.
2. Só entram ações com momentum positivo, ordenadas do maior para o menor.
3. Ações de escassez que estão no top 10 sobem para o começo da fila.
4. O top 5 é montado pulando empresas repetidas, setores que já têm 2 ações
   e ações "esticadas" (mais de 8% acima da média de 50 dias).
5. Stop inicial = preço atual × (1 − 10%); depois ele sobe junto com o topo.
"""
import pandas as pd

from . import config
from .universo import get_empresa, get_setor, is_escassez


def calcular_momentum(dados, lookback=config.LOOKBACK, exclude_last=config.EXCLUDE_LAST):
    """dados: {ticker: DataFrame com coluna Close}. Retorna {ticker: momentum}."""
    mom = {}
    for t, df in dados.items():
        if len(df) < lookback + exclude_last:
            continue
        p0 = df["Close"].iloc[-lookback]
        p1 = df["Close"].iloc[-exclude_last]
        if pd.notna(p0) and pd.notna(p1) and p0 > 0:
            mom[t] = p1 / p0 - 1
    return mom


def distancia_sma(df, dias=config.SMA_DIAS):
    """Quanto o último fechamento está acima (+) ou abaixo (−) da média de N dias."""
    sma = df["Close"].rolling(dias).mean()
    return df["Close"].iloc[-1] / sma.iloc[-1] - 1


def selecionar_top(momentum, dados=None, top_n=config.TOP_N, max_por_setor=config.MAX_POR_SETOR,
                   use_dedup=config.USE_DEDUP, top_escassez=config.TOP_ESCASSEZ,
                   timing_limit=config.TIMING_LIMIT):
    """
    Aplica as regras de seleção e devolve a lista de tickers, em ordem.
    Com `dados` e `timing_limit`, pula as ações esticadas (v26).
    Com timing_limit=None, é a seleção sem timing (athena_final.py).
    """
    candidatos = {t: v for t, v in momentum.items() if v > 0}
    # sorted é estável: em caso de empate vale a ordem original, como no script validado
    ranking = sorted(candidatos.items(), key=lambda x: -x[1])

    topo = ranking[:top_escassez]
    escassez_no_topo = [x for x in topo if is_escassez(x[0])]
    demais_no_topo = [x for x in topo if not is_escassez(x[0])]
    ranking = escassez_no_topo + demais_no_topo + ranking[top_escassez:]

    selecionados, por_setor, empresas = [], {}, set()
    for ticker, _ in ranking:
        if len(selecionados) >= top_n:
            break
        if use_dedup and get_empresa(ticker) in empresas:
            continue
        setor = get_setor(ticker)
        if por_setor.get(setor, 0) >= max_por_setor:
            continue
        if timing_limit is not None and dados is not None and ticker in dados:
            dist = distancia_sma(dados[ticker])
            if pd.notna(dist) and dist > timing_limit:
                continue  # esticada: espera o respiro, a próxima entra no lugar
        por_setor[setor] = por_setor.get(setor, 0) + 1
        selecionados.append(ticker)
        if use_dedup:
            empresas.add(get_empresa(ticker))
    return selecionados


def calcular_stop(preco, stop_pct=config.STOP_PCT):
    return preco * (1 - stop_pct)
