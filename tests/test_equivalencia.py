"""
Prova de que a versão nova escolhe EXATAMENTE as mesmas ações que a
versão validada (athena_final.py), em centenas de mercados sorteados.
"""
import numpy as np
import pandas as pd
import pytest

import referencia_athena_final as ref
from athena import config, universo
from athena.estrategia import calcular_momentum, calcular_stop, selecionar_top


def test_parametros_iguais():
    assert config.TOP_N == ref.TOP_N
    assert config.STOP_PCT == ref.STOP_PCT
    assert config.LOOKBACK == ref.LOOKBACK
    assert config.EXCLUDE_LAST == ref.EXCLUDE_LAST
    assert config.MAX_POR_SETOR == ref.MAX_POR_SETOR
    assert config.USE_DEDUP == ref.USE_DEDUP


def test_universo_igual():
    assert universo.TICKERS == ref.TICKERS  # mesma ordem (importa no desempate)
    assert {t: universo.get_setor(t) for t in universo.TICKERS} == ref.SETORES
    assert universo.EMPRESA_CANONICA == ref.EMPRESA_CANONICA
    assert universo.ESCASSEZ == ref.ESCASSEZ


def mercado_sorteado(semente, dias=300):
    """Gera preços aleatórios para as 75 ações, com algumas falhas de dados."""
    rng = np.random.default_rng(semente)
    indice = pd.bdate_range("2024-01-01", periods=dias)
    dados = {}
    for t in ref.TICKERS:
        tendencia = rng.normal(0, 0.0015)
        retornos = rng.normal(tendencia, 0.02, dias)
        precos = 20 * np.exp(np.cumsum(retornos))
        tamanho = dias if rng.random() > 0.05 else int(rng.integers(200, 272))  # algumas ações com pouco histórico
        dados[t] = pd.DataFrame({"Close": precos[-tamanho:]}, index=indice[-tamanho:])
    return dados


@pytest.mark.parametrize("semente", range(300))
def test_mesmo_top5_que_o_original(semente):
    dados = mercado_sorteado(semente)
    mom_novo = calcular_momentum(dados)
    mom_ref = ref.calcular_momentum(dados)
    assert mom_novo == mom_ref
    assert selecionar_top(mom_novo) == ref.selecionar_top5(mom_ref)


def test_stop_igual():
    for preco in (10.0, 37.42, 91.83):
        assert calcular_stop(preco) == preco * (1 - ref.STOP_PCT)
