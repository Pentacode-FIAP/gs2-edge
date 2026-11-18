import { Link } from 'react-router'
import { linkDoAlerta } from '../domain/alertas'
import { formatarHaQuanto, formatarNumero } from '../domain/tempo'
import Icone from './Icone'
import { SeloStatus } from './SeloStatus'
import SinalTipo from './SinalTipo'

function detalhe(alerta) {
  if (alerta.fonte === 'sensor') {
    return alerta.valor !== null ? `${formatarNumero(alerta.valor)} ${alerta.unidade}` : 'sem leitura'
  }
  const n = alerta.confirmacoes ?? 0
  return n === 1 ? '1 vizinho confirmou' : `${n} vizinhos confirmaram`
}

// Uma linha da lista de avisos (alerta de sensor ou relato de morador).
export default function AlertaCard({ alerta, destacado = false, aoPassarMouse }) {
  return (
    <Link
      to={linkDoAlerta(alerta)}
      onMouseEnter={aoPassarMouse}
      onFocus={aoPassarMouse}
      aria-current={destacado ? 'true' : undefined}
      className={`group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-bg ${destacado ? 'bg-pri-l/60' : ''}`}
    >
      <SinalTipo tipo={alerta.tipo} />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="font-bold">{alerta.titulo}</span>
          {alerta.gravidade === 'alta' && <span className="text-xs font-bold text-bad uppercase">grave</span>}
        </p>
        <p className="text-sm text-mut">
          {alerta.local} · {formatarHaQuanto(alerta.desde)}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <SeloStatus status={alerta.status} />
          <span className="text-sm text-mut">{detalhe(alerta)}</span>
        </p>
      </div>
      <Icone nome="voltar" className="mt-2.5 size-4 shrink-0 rotate-180 text-mut transition-transform group-hover:translate-x-0.5" />
    </Link>
  )
}
