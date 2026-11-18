import { formatarNumero } from '../domain/tempo'

const L = 600
const A = 220
const MARGEM = { topo: 14, dir: 16, baixo: 26, esq: 44 }

const NOMES_MEDIDA = { tensao: 'Tensão do poste', latencia: 'Latência da rede', nivelAgua: 'Nível da água na rua' }

// Gráfico de linha da leitura do sensor nos últimos 30 minutos.
// As linhas tracejadas são as faixas do firmware: servem só para desenhar (quem decide é o sensor).
export default function GraficoSerie({ serie }) {
  const { pontos, faixas, unidade, medida } = serie
  if (!pontos?.length) return <p className="text-sm text-mut">Sem leituras recentes.</p>

  const valores = [...pontos.map((p) => p.v), faixas.atencao, faixas.falha]
  const minimo = Math.min(...valores)
  const maximo = Math.max(...valores)
  const folga = (maximo - minimo) * 0.15 || 1
  const yMin = Math.max(0, minimo - folga)
  const yMax = maximo + folga

  const t0 = new Date(pontos[0].t).getTime()
  const t1 = new Date(pontos.at(-1).t).getTime()
  const x = (t) => MARGEM.esq + ((new Date(t).getTime() - t0) / (t1 - t0 || 1)) * (L - MARGEM.esq - MARGEM.dir)
  const y = (v) => MARGEM.topo + (1 - (v - yMin) / (yMax - yMin)) * (A - MARGEM.topo - MARGEM.baixo)

  const caminho = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.t).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ')
  const ultimo = pontos.at(-1)
  const nome = NOMES_MEDIDA[medida] ?? medida
  const descricao = `${nome} nos últimos 30 minutos, de ${formatarNumero(pontos[0].v)} para ${formatarNumero(ultimo.v)} ${unidade}. Faixa de atenção em ${faixas.atencao} ${unidade} e de falha em ${faixas.falha} ${unidade}.`

  const linhasFaixa = [
    { valor: faixas.atencao, rotulo: 'atenção', cor: 'var(--warn)' },
    { valor: faixas.falha, rotulo: 'falha', cor: 'var(--bad)' },
  ]

  return (
    <figure>
      <svg viewBox={`0 0 ${L} ${A}`} className="h-auto w-full" role="img" aria-label={descricao}>
        {/* eixo Y: mínimo e máximo */}
        {[yMin, (yMin + yMax) / 2, yMax].map((v) => (
          <g key={v}>
            <line x1={MARGEM.esq} x2={L - MARGEM.dir} y1={y(v)} y2={y(v)} stroke="var(--line)" />
            <text x={MARGEM.esq - 6} y={y(v) + 4} textAnchor="end" fontSize="11" fill="var(--mut)">
              {Math.round(v)}
            </text>
          </g>
        ))}

        {linhasFaixa.map((f) => (
          <g key={f.rotulo}>
            <line
              x1={MARGEM.esq}
              x2={L - MARGEM.dir}
              y1={y(f.valor)}
              y2={y(f.valor)}
              stroke={f.cor}
              strokeDasharray="6 5"
              strokeWidth="1.5"
            />
            <text x={L - MARGEM.dir - 4} y={y(f.valor) - 5} textAnchor="end" fontSize="11" fontWeight="600" fill={f.cor}>
              {f.rotulo} · {f.valor} {unidade}
            </text>
          </g>
        ))}

        <path d={caminho} fill="none" stroke="var(--pri)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(ultimo.t)} cy={y(ultimo.v)} r="5" fill="var(--pri)" stroke="var(--card)" strokeWidth="2" />

        {[
          { t: pontos[0].t, rotulo: '30 min atrás', ancora: 'start' },
          { t: pontos[Math.floor(pontos.length / 2)].t, rotulo: '15 min atrás', ancora: 'middle' },
          { t: ultimo.t, rotulo: 'agora', ancora: 'end' },
        ].map((m) => (
          <text key={m.rotulo} x={x(m.t)} y={A - 6} textAnchor={m.ancora} fontSize="11" fill="var(--mut)">
            {m.rotulo}
          </text>
        ))}
      </svg>
      <figcaption className="mt-1 text-xs text-mut">
        {nome} ({unidade}). Linhas tracejadas: limites usados pelo sensor.
      </figcaption>
    </figure>
  )
}
