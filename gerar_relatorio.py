"""
RELATÓRIO SEMANAL DO ATHENA
===========================
Junta os sinais e as análises de notícias dos últimos 7 dias e pede ao Claude
um resumo da semana. Roda às sextas, depois do robô diário (ou à mão).

Rode com:  python gerar_relatorio.py
"""
import sys
from datetime import date, timedelta

from athena.banco import enviar_ia, ia_conteudo_desde, sinais_desde
from athena.ia import gerar_relatorio


def main():
    inicio = (date.today() - timedelta(days=7)).isoformat()
    sinais = sinais_desde(inicio)
    if not sinais:
        print("Nenhum sinal nos últimos 7 dias: relatório não gerado.")
        return
    noticias = ia_conteudo_desde("noticias", inicio)
    semana = f"{sinais[0]['data']} a {sinais[-1]['data']}"
    print(f"Gerando o relatório da semana {semana} ({len(sinais)} sinais, {len(noticias)} análises de notícias)...")

    relatorio = gerar_relatorio(sinais, noticias, semana)
    if not relatorio:
        print("A IA não gerou o relatório (sem chave, recusa ou erro).")
        sys.exit(1)
    print(f"\n{relatorio['titulo']}\n{relatorio['resumo']}")
    enviar_ia("relatorio", sinais[-1]["data"], relatorio)


if __name__ == "__main__":
    main()
