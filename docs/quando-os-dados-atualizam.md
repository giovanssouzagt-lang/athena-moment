# Quando os dados do Athena são atualizados

O Athena **não** usa cotações em tempo real. Ele trabalha com o **preço de fechamento** de cada pregão, e isso é proposital. Este documento explica o ciclo diário, por que ele é assim e o que esperar em feriados, fins de semana e atrasos da fonte de dados.

## O ciclo de um dia

```
Dia X, 10h–17h  → a B3 está aberta; o Athena continua mostrando o fechamento anterior
Dia X, ~17h     → o pregão termina e sai o preço de fechamento do dia X
Dia X, 18h30    → o robô (GitHub Actions) baixa os fechamentos, roda a estratégia
                  e salva o novo Top 5 no banco
Dia X, à noite  → o app passa a mostrar "Sinal de X" (o Top 5 e os alertas novos)
Dia X+1         → você usa esse sinal para comprar ou vender na corretora
```

O robô roda **uma vez por dia útil**, às **18h30 (horário de Brasília)**. O app **não muda durante o pregão**: quando a bolsa abre de manhã, ele continua mostrando o fechamento do dia anterior até o robô rodar de novo à noite.

A data que aparece no topo do app ("Sinal de 17/11/2026") é a data do **último fechamento usado** no cálculo, não a data de hoje.

## Por que fechamento e não tempo real

**1. É assim que a estratégia foi testada.**
Todo o backtest (momentum, timing pela média de 50 dias e stop móvel) foi calculado com preços de fechamento. Usar outro tipo de preço seria usar uma estratégia diferente da que foi validada.

**2. O preço no meio do dia gera alarmes falsos.**
Exemplo: uma ação cai 11% às 11h da manhã e se recupera até o fechamento. Com preço ao vivo, o stop móvel de 10% mandaria vender, e no fechamento ela nem teria batido o stop. O backtest nunca vendeu por oscilação dentro do dia.

**3. A estratégia é de médio prazo.**
O momentum olha cerca de 12 meses de retorno, e a carteira é revisada uma vez por mês. Algumas horas de diferença não mudam o Top 5.

**4. Tempo real da B3 é pago.**
A B3 cobra licença para distribuir cotações ao vivo. Fontes gratuitas têm atraso (de minutos, ou de dias no caso do fechamento).

Para ver o preço do momento na hora de comprar, use o app da sua corretora, que mostra a cotação praticamente ao vivo.

## Exemplo real: semana de 16 a 20/11/2026

| Quando | O que acontece | O app mostra |
|---|---|---|
| Ter 17/11, 18h30 | O robô gera o sinal com o fechamento de 17/11 | Sinal de 17/11 |
| Qua 18/11, 18h30 | A fonte (Yahoo Finance) ainda não publicou o fechamento de 18/11 | Continua 17/11 |
| Qui 19/11, durante o dia | A bolsa está aberta, mas o app só muda depois do fechamento | Continua 17/11 |
| Qui 19/11, 18h30 | O robô roda de novo e busca 18/11 e 19/11 | Sinal de 19/11, se a fonte já publicou |
| Sex 20/11 | Feriado da Consciência Negra: a B3 não abre | Continua 19/11 |
| Seg 23/11, 18h30 | Novo pregão, novo sinal | Sinal de 23/11 |

## Feriados e fins de semana

- **Sábado e domingo:** não há pregão. O robô não roda (ele só roda de segunda a sexta), e o app mostra o fechamento de sexta-feira.
- **Feriados da B3:** o robô roda no horário normal, mas não há preço novo. Ele recalcula com o último fechamento disponível, e a data do sinal não muda.

## Quando a fonte de dados atrasa

O Athena usa o **Yahoo Finance**, que é gratuito mas às vezes demora para publicar o fechamento da B3 (de algumas horas a um dia ou mais). Quando isso acontece:

- O robô usa o último fechamento que existe, e a data no topo do app mostra qual é.
- Não há perda de dados: quando o Yahoo publica os dias atrasados, a próxima rodada do robô busca o histórico completo novamente e preenche tudo.
- O impacto na escolha das ações é pequeno, porque o momentum olha 12 meses. O ponto mais sensível é o **stop móvel**: num dia de queda forte, o alerta de venda pode chegar um dia depois.

## Como usar o sinal na prática

1. **À noite ou no dia seguinte**, abra o Athena e veja "O que fazer hoje".
2. Se houver compras ou vendas a fazer, execute-as **no pregão seguinte**, pelo app da corretora.
3. **Anote** no Athena o que você comprou ou vendeu (o app é o seu caderno de anotações; ele não compra nada sozinho).
4. Não é preciso abrir o app várias vezes por dia: o sinal só muda uma vez por dia útil, depois das 18h30.

## Rodar o robô manualmente

Se quiser atualizar fora do horário (por exemplo, depois que o Yahoo publicar um fechamento atrasado):

- **Pelo GitHub:** aba *Actions* → *Sinal diário* → *Run workflow*.
- **No computador:** `python gerar_sinal.py` na pasta do projeto (com as chaves no arquivo `.env`).
