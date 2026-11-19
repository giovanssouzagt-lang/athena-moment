"""
Universo de 75 ações do Ibovespa, com nome, setor, tese de escassez e
empresa canônica (para não comprar a mesma empresa duas vezes).
"""

# ticker: (nome, setor)
ATIVOS = {
    "VALE3.SA": ("Vale", "Mineracao"),
    "ITUB4.SA": ("Itaú Unibanco", "Financeiro"),
    "PETR4.SA": ("Petrobras PN", "Petroleo"),
    "AXIA3.SA": ("Axia Energia", "Energia"),
    "PETR3.SA": ("Petrobras ON", "Petroleo"),
    "SBSP3.SA": ("Sabesp", "Saneamento"),
    "BBDC4.SA": ("Bradesco PN", "Financeiro"),
    "B3SA3.SA": ("B3", "Financeiro"),
    "ITSA4.SA": ("Itaúsa", "Financeiro"),
    "WEGE3.SA": ("WEG", "BensInd"),
    "EMBJ3.SA": ("Embraer", "BensInd"),
    "BPAC11.SA": ("BTG Pactual", "Financeiro"),
    "ABEV3.SA": ("Ambev", "Consumo"),
    "BBAS3.SA": ("Banco do Brasil", "Financeiro"),
    "ENEV3.SA": ("Eneva", "Energia"),
    "PRIO3.SA": ("PRIO", "Petroleo"),
    "EQTL3.SA": ("Equatorial", "Energia"),
    "CPLE3.SA": ("Copel", "Energia"),
    "VBBR3.SA": ("Vibra Energia", "Petroleo"),
    "RDOR3.SA": ("Rede D'Or", "Saude"),
    "UGPA3.SA": ("Ultrapar", "Petroleo"),
    "RENT3.SA": ("Localiza", "BensInd"),
    "GGBR4.SA": ("Gerdau", "Mineracao"),
    "SUZB3.SA": ("Suzano", "Papel"),
    "RADL3.SA": ("Raia Drogasil", "Saude"),
    "BBSE3.SA": ("BB Seguridade", "Financeiro"),
    "BBDC3.SA": ("Bradesco ON", "Financeiro"),
    "CSMG3.SA": ("Copasa", "Saneamento"),
    "RAIL3.SA": ("Rumo", "Logistica"),
    "VIVT3.SA": ("Vivo (Telefônica)", "Telecom"),
    "CMIG4.SA": ("Cemig", "Energia"),
    "TOTS3.SA": ("Totvs", "Tecnologia"),
    "ENGI11.SA": ("Energisa", "Energia"),
    "MOTV3.SA": ("Motiva", "BensInd"),
    "KLBN11.SA": ("Klabin", "Papel"),
    "TIMS3.SA": ("TIM", "Telecom"),
    "MBRF3.SA": ("MBRF", "Consumo"),
    "EGIE3.SA": ("Engie Brasil", "Energia"),
    "ALOS3.SA": ("Allos", "Shopping"),
    "ISAE4.SA": ("ISA Energia", "Energia"),
    "CXSE3.SA": ("Caixa Seguridade", "Financeiro"),
    "ASAI3.SA": ("Assaí", "Varejo"),
    "SANB11.SA": ("Santander Brasil", "Financeiro"),
    "LREN3.SA": ("Lojas Renner", "Varejo"),
    "SMFT3.SA": ("Smart Fit", "Varejo"),
    "CMIN3.SA": ("CSN Mineração", "Mineracao"),
    "MULT3.SA": ("Multiplan", "Shopping"),
    "GOAU4.SA": ("Metalúrgica Gerdau", "Mineracao"),
    "PSSA3.SA": ("Porto Seguro", "Financeiro"),
    "CSAN3.SA": ("Cosan", "Petroleo"),
    "TAEE11.SA": ("Taesa", "Energia"),
    "FLRY3.SA": ("Fleury", "Saude"),
    "CPFE3.SA": ("CPFL Energia", "Energia"),
    "NATU3.SA": ("Natura", "Varejo"),
    "HYPE3.SA": ("Hypera", "Varejo"),
    "CYRE3.SA": ("Cyrela", "Construcao"),
    "BRAP4.SA": ("Bradespar", "Mineracao"),
    "IGTI11.SA": ("Iguatemi", "Shopping"),
    "CURY3.SA": ("Cury", "Construcao"),
    "BRAV3.SA": ("Brava Energia", "Petroleo"),
    "COGN3.SA": ("Cogna", "Educacao"),
    "TEND3.SA": ("Tenda", "Construcao"),
    "CSNA3.SA": ("CSN", "Mineracao"),
    "USIM5.SA": ("Usiminas", "Mineracao"),
    "DIRR3.SA": ("Direcional", "Construcao"),
    "AURE3.SA": ("Auren Energia", "Energia"),
    "POMO4.SA": ("Marcopolo", "BensInd"),
    "VIVA3.SA": ("Vivara", "Varejo"),
    "YDUQ3.SA": ("Yduqs", "Educacao"),
    "MRVE3.SA": ("MRV", "Construcao"),
    "AZZA3.SA": ("Azzas 2154", "Varejo"),
    "HAPV3.SA": ("Hapvida", "Saude"),
    "BEEF3.SA": ("Minerva", "Consumo"),
    "CEAB3.SA": ("C&A", "Varejo"),
    "VAMO3.SA": ("Vamos", "Logistica"),
}

# A ordem importa: é a mesma do projeto original (desempate do ranking)
TICKERS = list(ATIVOS)

EMPRESA_CANONICA = {
    "PETR3.SA": "PETROBRAS", "PETR4.SA": "PETROBRAS",
    "BBDC3.SA": "BRADESCO", "BBDC4.SA": "BRADESCO",
}

# Tese de escassez: empresas de recursos finitos
ESCASSEZ = {
    "VALE3.SA", "GGBR4.SA", "GOAU4.SA", "CSNA3.SA", "USIM5.SA", "CMIN3.SA", "BRAP4.SA",
    "PETR3.SA", "PETR4.SA", "PRIO3.SA", "UGPA3.SA", "VBBR3.SA", "CSAN3.SA", "BRAV3.SA",
    "SUZB3.SA", "KLBN11.SA",
    "AXIA3.SA", "ENEV3.SA", "EQTL3.SA", "CPLE3.SA", "CMIG4.SA", "ENGI11.SA",
    "EGIE3.SA", "ISAE4.SA", "TAEE11.SA", "CPFE3.SA", "AURE3.SA",
    "SBSP3.SA", "CSMG3.SA",
}


def get_nome(t):
    return ATIVOS.get(t, (t, "Outros"))[0]


def get_setor(t):
    return ATIVOS.get(t, (t, "Outros"))[1]


def get_empresa(t):
    return EMPRESA_CANONICA.get(t, t)


def is_escassez(t):
    return t in ESCASSEZ


def sem_sufixo(t):
    return t.replace(".SA", "")
