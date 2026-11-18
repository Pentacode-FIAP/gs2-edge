import { infoTipo } from '../domain/tipos'
import { formatarDuracao } from '../domain/tempo'

// Uma linha do resumo do bairro: tipo, barra proporcional e tempo sem serviço.
export default function BarraHoras({ item, maximo }) {
  const info = infoTipo(item.tipo)
  const semHoras = item.minutos === null
  const largura = semHoras || maximo === 0 ? 0 : Math.max(3, (item.minutos / maximo) * 100)

  return (
    <li className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
      <span className="font-semibold">{info.rotulo}</span>
      <span className="h-3 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span className="block h-full rounded-full" style={{ width: `${largura}%`, backgroundColor: info.cor }} />
      </span>
      <span className="text-right font-bold tabular-nums">
        {semHoras
          ? `${item.avisos} ${item.avisos === 1 ? 'aviso' : 'avisos'}`
          : item.minutos === 0
            ? 'sem registro'
            : formatarDuracao(item.minutos)}
      </span>
    </li>
  )
}
