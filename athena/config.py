"""
Parâmetros da estratégia Athena v26.

Seleção: momentum + escassez + setor + dedup (validados em v20–v21) e
timing pela média de 50 dias. Gestão: stop móvel de 10% e colchão de 40%
no CDI (v24–v26). Mudar qualquer número aqui muda a estratégia: rode os
testes depois.
"""

TOP_N = 5  # quantas ações entram na carteira recomendada
LOOKBACK = 252  # momentum: retorno de ~12 meses (252 pregões)...
EXCLUDE_LAST = 21  # ...ignorando o último mês (21 pregões)
MAX_POR_SETOR = 2  # no máximo 2 ações do mesmo setor
USE_DEDUP = True  # PETR3 e PETR4 contam como uma empresa só
TOP_ESCASSEZ = 10  # ações de escassez dentro do top 10 ganham prioridade

# Timing ("respiro"): não compra ação mais de 8% acima da média de 50 dias;
# ela é pulada e a próxima do ranking entra no lugar.
SMA_DIAS = 50
TIMING_LIMIT = 0.08
PONTO_DE_COMPRA = 0.03  # até 3% acima da média: selo "Ponto de compra"

# Gestão de risco
STOP_PCT = 0.10  # stop MÓVEL: 10% abaixo do maior preço desde a compra
CASH_BUFFER = 0.40  # colchão: 40% do patrimônio no CDI, 60% em ações
TOLERANCIA_COLCHAO = 0.15  # alerta quando o CDI foge mais de 15% do ideal

DIAS_DOWNLOAD = 600  # dias corridos de histórico baixados
BENCHMARK = "BOVA11.SA"
DIAS_PRECOS_BANCO = 252  # fechamentos enviados ao banco (para o stop móvel)

# Alerta de concentração: avisa quando um setor passa deste peso nas ações
LIMITE_CONCENTRACAO_SETOR = 0.40
