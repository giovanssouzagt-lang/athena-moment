"""
Copia FIEL da selecao do athena_app.py v26 (pasta projeto_b3): momentum +
escassez + setor + dedup + TIMING (SMA50). Usada como referencia nos testes.
"""
import pandas as pd

TOP_N = 5
STOP_PCT = 0.10       # Trailing Stop v26
TIMING_LIMIT = 0.08   # Timing SMA50 v26
CASH_BUFFER = 0.40    # Colchão de Caixa v26 (40%)
LOOKBACK = 252
EXCLUDE_LAST = 21
MAX_POR_SETOR = 2
SETORES = {"PETR3.SA": "Petroleo", "PETR4.SA": "Petroleo", "PRIO3.SA": "Petroleo", "UGPA3.SA": "Petroleo", "VBBR3.SA": "Petroleo", "CSAN3.SA": "Petroleo", "BRAV3.SA": "Petroleo", "AXIA3.SA": "Energia", "ENEV3.SA": "Energia", "EQTL3.SA": "Energia", "CPLE3.SA": "Energia", "CMIG4.SA": "Energia", "ENGI11.SA": "Energia", "EGIE3.SA": "Energia", "ISAE4.SA": "Energia", "TAEE11.SA": "Energia", "CPFE3.SA": "Energia", "AURE3.SA": "Energia", "ITUB4.SA": "Financeiro", "BBDC4.SA": "Financeiro", "BBAS3.SA": "Financeiro", "BBDC3.SA": "Financeiro", "SANB11.SA": "Financeiro", "BPAC11.SA": "Financeiro", "ITSA4.SA": "Financeiro", "B3SA3.SA": "Financeiro", "BBSE3.SA": "Financeiro", "CXSE3.SA": "Financeiro", "PSSA3.SA": "Financeiro", "VALE3.SA": "Mineracao", "GGBR4.SA": "Mineracao", "GOAU4.SA": "Mineracao", "CSNA3.SA": "Mineracao", "USIM5.SA": "Mineracao", "CMIN3.SA": "Mineracao", "BRAP4.SA": "Mineracao", "RADL3.SA": "Saude", "FLRY3.SA": "Saude", "HAPV3.SA": "Saude", "RDOR3.SA": "Saude", "CYRE3.SA": "Construcao", "DIRR3.SA": "Construcao", "CURY3.SA": "Construcao", "MRVE3.SA": "Construcao", "TEND3.SA": "Construcao", "LREN3.SA": "Varejo", "ASAI3.SA": "Varejo", "NATU3.SA": "Varejo", "HYPE3.SA": "Varejo", "SMFT3.SA": "Varejo", "VIVA3.SA": "Varejo", "AZZA3.SA": "Varejo", "CEAB3.SA": "Varejo", "ABEV3.SA": "Consumo", "MBRF3.SA": "Consumo", "BEEF3.SA": "Consumo", "WEGE3.SA": "BensInd", "EMBJ3.SA": "BensInd", "MOTV3.SA": "BensInd", "POMO4.SA": "BensInd", "RENT3.SA": "BensInd", "TOTS3.SA": "Tecnologia", "SBSP3.SA": "Saneamento", "CSMG3.SA": "Saneamento", "SUZB3.SA": "Papel", "KLBN11.SA": "Papel", "VIVT3.SA": "Telecom", "TIMS3.SA": "Telecom", "ALOS3.SA": "Shopping", "MULT3.SA": "Shopping", "IGTI11.SA": "Shopping", "RAIL3.SA": "Logistica", "VAMO3.SA": "Logistica", "COGN3.SA": "Educacao", "YDUQ3.SA": "Educacao"}
EMPRESA_CANONICA = {"PETR3.SA": "PETROBRAS", "PETR4.SA": "PETROBRAS", "BBDC3.SA": "BRADESCO", "BBDC4.SA": "BRADESCO"}
ESCASSEZ = {"VALE3.SA", "GGBR4.SA", "GOAU4.SA", "CSNA3.SA", "USIM5.SA", "CMIN3.SA", "BRAP4.SA", "PETR3.SA", "PETR4.SA", "PRIO3.SA", "UGPA3.SA", "VBBR3.SA", "CSAN3.SA", "BRAV3.SA", "SUZB3.SA", "KLBN11.SA", "AXIA3.SA", "ENEV3.SA", "EQTL3.SA", "CPLE3.SA", "CMIG4.SA", "ENGI11.SA", "EGIE3.SA", "ISAE4.SA", "TAEE11.SA", "CPFE3.SA", "AURE3.SA", "SBSP3.SA", "CSMG3.SA"}
def get_setor(t): return SETORES.get(t, "Outros")
def get_empresa(t): return EMPRESA_CANONICA.get(t, t)
def is_escassez(t): return t in ESCASSEZ
def calcular_momentum(dados):
    mom = {}
    for t, df in dados.items():
        if len(df) < LOOKBACK + EXCLUDE_LAST: continue
        p0 = df["Close"].iloc[-LOOKBACK]
        p1 = df["Close"].iloc[-EXCLUDE_LAST]
        if pd.notna(p0) and pd.notna(p1) and p0 > 0: mom[t] = p1 / p0 - 1
    return mom
def selecionar_top5(momentum, dados):
    candidatos = {t: v for t, v in momentum.items() if v > 0}
    ranking = sorted(candidatos.items(), key=lambda x: -x[1])
    top10 = ranking[:10]
    esc_no_top10 = [x for x in top10 if is_escassez(x[0])]
    nao_esc = [x for x in top10 if not is_escassez(x[0])]
    ranking = esc_no_top10 + nao_esc + ranking[10:]

    selecionados, contagem, empresas = [], {}, set()
    for ticker, _ in ranking:
        if len(selecionados) >= TOP_N: break
        emp = get_empresa(ticker)
        if emp in empresas: continue
        setor = get_setor(ticker)
        if contagem.get(setor, 0) >= MAX_POR_SETOR: continue

        if ticker in dados:
            dist = dados[ticker]["dist_sma"].iloc[-1]
            if pd.notna(dist) and dist > TIMING_LIMIT: continue

        contagem[setor] = contagem.get(setor, 0) + 1
        selecionados.append(ticker)
        empresas.add(emp)
    return selecionados
