import { GRAVIDADES, STATUS } from '../domain/tipos'

const CORES = {
  ok: { ponto: 'bg-ok', texto: 'text-ok' },
  warn: { ponto: 'bg-warn', texto: 'text-warn' },
  bad: { ponto: 'bg-bad', texto: 'text-bad' },
  neutro: { ponto: 'bg-mut', texto: 'text-mut' },
}

// Status escrito com um ponto colorido ao lado: a cor reforça, o texto informa.
export function SeloStatus({ status }) {
  const info = STATUS[status] ?? { rotulo: status, tom: 'neutro' }
  const cor = CORES[info.tom]
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${cor.texto}`}>
      <span className={`size-2 shrink-0 rounded-full ${cor.ponto}`} aria-hidden="true" />
      {info.rotulo}
    </span>
  )
}

export function SeloGravidade({ gravidade }) {
  const tom = gravidade === 'alta' ? 'bad' : gravidade === 'media' ? 'warn' : 'neutro'
  return (
    <span className={`text-sm font-semibold ${CORES[tom].texto}`}>
      Gravidade {GRAVIDADES[gravidade]?.rotulo.toLowerCase() ?? gravidade}
    </span>
  )
}

export function SeloFonte({ fonte }) {
  return <span className="text-sm text-mut">{fonte === 'sensor' ? 'Sensor Vizi' : 'Aviso de morador'}</span>
}
