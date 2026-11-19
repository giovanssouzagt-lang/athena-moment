/**
 * "Quanto quer investir hoje?": divide o valor pela regra 60/40 e calcula
 * quantas ações inteiras comprar de cada uma do Top 5.
 *
 * 1. 40% vai para o CDI e 60% para ações.
 * 2. Os 60% são divididos igualmente entre as 5 ações.
 * 3. Cada parte compra o máximo de ações inteiras.
 * 4. Aproveitamento de sobras: com o troco de todas, compra 1 ação extra da
 *    mais barata que couber, e repete até não caber mais nenhuma.
 * 5. Os centavos que sobrarem vão para o CDI.
 *
 * As contas são feitas em centavos inteiros, para não haver erro de arredondamento.
 */
export function planoAporte(valor, top, cashBuffer) {
  const centavos = (v) => Math.round(v * 100);
  const totalC = centavos(valor);
  if (totalC <= 0 || !top.length) return null;

  const acoesC = Math.round(totalC * (1 - cashBuffer));
  const cdiBaseC = totalC - acoesC;
  const baseC = Math.floor(acoesC / top.length);

  const itens = top.map((a) => {
    const precoC = centavos(a.preco);
    const qtd = Math.floor(baseC / precoC);
    return { ticker: a.ticker, nome: a.nome, setor: a.setor, preco: a.preco, precoC, stop: a.stop, qtd, extras: 0 };
  });

  let sobraC = acoesC - itens.reduce((s, i) => s + i.qtd * i.precoC, 0);
  const porPreco = [...itens].sort((a, b) => a.precoC - b.precoC);
  for (;;) {
    const cabe = porPreco.find((i) => i.precoC <= sobraC);
    if (!cabe) break;
    cabe.qtd += 1;
    cabe.extras += 1;
    sobraC -= cabe.precoC;
  }

  const gastoC = acoesC - sobraC;
  return {
    itens: itens.map(({ precoC, ...i }) => ({ ...i, custo: (i.qtd * precoC) / 100 })),
    totalAcoes: gastoC / 100,
    totalCdi: (cdiBaseC + sobraC) / 100,
    sobraParaCdi: sobraC / 100,
    valor: totalC / 100,
  };
}
