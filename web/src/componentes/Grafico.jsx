/**
 * Gráfico de linhas em SVG, sem bibliotecas (deixa o app leve).
 * series: [{ nome, valores: number[], cor }]; rotulos: datas (opcional)
 */
import { useId } from 'react';

const formatarData = (d) => {
  const [a, m, dia] = d.split('-');
  return `${dia}/${m}/${a.slice(2)}`;
};

export function Grafico({ series, rotulos, altura = 180, compacto = false }) {
  const id = useId().replace(/:/g, '');
  const L = 320, A = altura;
  const margem = compacto ? { x: 2, y: 6 } : { x: 6, y: 18 };
  const todos = series.flatMap((s) => s.valores);
  if (!todos.length) return null;
  let min = Math.min(...todos), max = Math.max(...todos);
  if (min === max) { min -= 1; max += 1; }
  const n = Math.max(...series.map((s) => s.valores.length));
  const x = (i) => margem.x + (i / (n - 1)) * (L - margem.x * 2);
  const y = (v) => margem.y + (1 - (v - min) / (max - min)) * (A - margem.y * 2);
  const caminho = (vals) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');

  const principal = series[0];
  const area = `${caminho(principal.valores)} L${x(principal.valores.length - 1)},${A} L${x(0)},${A} Z`;

  return (
    <svg className="grafico" viewBox={`0 0 ${L} ${A}`} preserveAspectRatio="none" role="img"
      aria-label={series.map((s) => s.nome).join(' contra ')}>
      <defs>
        <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={principal.cor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={principal.cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      {!compacto && [0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={L} y1={A * f} y2={A * f} className="grafico-grade" />
      ))}
      <path d={area} fill={`url(#area-${id})`} />
      {series.slice().reverse().map((s) => (
        <path key={s.nome} d={caminho(s.valores)} fill="none" stroke={s.cor}
          strokeWidth={compacto ? 1.8 : 2.2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      ))}
      {!compacto && rotulos && (
        <>
          <text x="4" y={A - 4} className="grafico-rotulo">{formatarData(rotulos[0])}</text>
          <text x={L - 4} y={A - 4} textAnchor="end" className="grafico-rotulo">{formatarData(rotulos[rotulos.length - 1])}</text>
          <text x="4" y="12" className="grafico-rotulo">{max.toFixed(0)}</text>
        </>
      )}
    </svg>
  );
}
