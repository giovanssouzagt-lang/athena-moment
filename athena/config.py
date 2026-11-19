"""
Parâmetros da estratégia Athena.

Os valores são os da versão validada (athena_final.py, backtests v20–v21):
Sharpe 1,06 | CAGR ~20% | queda máxima ~18% no período 2021–2026.
Mudar qualquer número aqui muda a estratégia: rode os testes depois.
"""

TOP_N = 5  # quantas ações entram na carteira recomendada
STOP_PCT = 0.22  # stop loss: preço × (1 − 22%)
LOOKBACK = 252  # momentum: retorno de ~12 meses (252 pregões)...
EXCLUDE_LAST = 21  # ...ignorando o último mês (21 pregões)
MAX_POR_SETOR = 2  # no máximo 2 ações do mesmo setor
USE_DEDUP = True  # PETR3 e PETR4 contam como uma empresa só
TOP_ESCASSEZ = 10  # ações de escassez dentro do top 10 ganham prioridade

DIAS_DOWNLOAD = 600  # dias corridos de histórico baixados
BENCHMARK = "BOVA11.SA"

# Alerta de concentração: avisa quando um setor passa deste peso na carteira
LIMITE_CONCENTRACAO_SETOR = 0.40
