"""
Prova de que a versão nova escolhe EXATAMENTE as mesmas ações que as
versões validadas, em centenas de mercados sorteados:
- athena_final.py (seleção sem timing)
- athena_app.py v26 (seleção com timing pela média de 50 dias)
"""
import numpy as np
import pandas as pd
import pytest

import referencia_athena_final as ref
import referencia_athena_v26 as ref26
from athena import config, universo
from athena.estrategia import calcular_momentum, calcular_stop, selecionar_top


def test_parametros_iguais_ao_v26():
    assert config.TOP_N == ref26.TOP_N
    assert config.STOP_PCT == ref26.STOP_PCT
    assert config.TIMING_LIMIT == ref26.TIMING_LIMIT
    assert config.CASH_BUFFER == ref26.CASH_BUFFER
    assert config.LOOKBACK == ref26.LOOKBACK
    assert config.EXCLUDE_LAST == ref26.EXCLUDE_LAST
    assert config.MAX_POR_SETOR == ref26.MAX_POR_SETOR


def test_universo_igual():
    assert universo.TICKERS == ref.TICKERS  # mesma ordem (importa no desempate)
    assert {t: universo.get_setor(t) for t in universo.TICKERS} == ref.SETORES == ref26.SETORES
    assert universo.EMPRESA_CANONICA == ref.EMPRESA_CANONICA == ref26.EMPRESA_CANONICA
    assert universo.ESCASSEZ == ref.ESCASSEZ == ref26.ESCASSEZ


def mercado_sorteado(semente, dias=300):
    """Gera preços aleatórios para as 75 ações, com algumas falhas de dados."""
    rng = np.random.default_rng(semente)
    indice = pd.bdate_range("2024-01-01", periods=dias)
    dados = {}
    for t in ref.TICKERS:
        tendencia = rng.normal(0, 0.0015)
        retornos = rng.normal(tendencia, 0.02, dias)
        # às vezes um disparo no fim, para criar ações "esticadas"
        if rng.random() < 0.3:
            retornos[-10:] += rng.uniform(0.005, 0.02)
        precos = 20 * np.exp(np.cumsum(retornos))
        tamanho = dias if rng.random() > 0.05 else int(rng.integers(200, 272))
        dados[t] = pd.DataFrame({"Close": precos[-tamanho:]}, index=indice[-tamanho:])
    return dados


def com_dist_sma(dados):
    """Formato que o athena_app.py v26 usa: colunas sma50 e dist_sma."""
    saida = {}
    for t, df in dados.items():
        df = df.copy()
        df["sma50"] = df["Close"].rolling(50).mean()
        df["dist_sma"] = (df["Close"] / df["sma50"]) - 1
        saida[t] = df
    return saida


@pytest.mark.parametrize("semente", range(300))
def test_sem_timing_igual_ao_athena_final(semente):
    dados = mercado_sorteado(semente)
    mom = calcular_momentum(dados)
    assert mom == ref.calcular_momentum(dados)
    assert selecionar_top(mom, timing_limit=None) == ref.selecionar_top5(mom)


@pytest.mark.parametrize("semente", range(300))
def test_com_timing_igual_ao_athena_v26(semente):
    dados = mercado_sorteado(semente)
    mom = calcular_momentum(dados)
    assert mom == ref26.calcular_momentum(dados)
    assert selecionar_top(mom, dados) == ref26.selecionar_top5(mom, com_dist_sma(dados))


def test_o_timing_realmente_muda_a_selecao_em_alguns_mercados():
    # garante que o teste acima exercita o filtro (não passa "por acaso")
    mudou = sum(
        selecionar_top(calcular_momentum(d), d) != selecionar_top(calcular_momentum(d), timing_limit=None)
        for d in (mercado_sorteado(s) for s in range(60))
    )
    assert mudou > 10


def test_stop_inicial_de_10_por_cento():
    for preco in (10.0, 37.42, 91.83):
        assert calcular_stop(preco) == preco * (1 - ref26.STOP_PCT)
