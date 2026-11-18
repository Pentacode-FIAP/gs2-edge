import { formatarDataHora } from '../domain/tempo'

// Lista de eventos do aviso, do mais recente para o mais antigo.
export default function LinhaDoTempo({ itens = [] }) {
  const ordenados = [...itens].sort((a, b) => new Date(b.t) - new Date(a.t))
  if (ordenados.length === 0) return <p className="text-sm text-mut">Sem eventos registrados.</p>

  return (
    <ol className="relative ml-1.5 border-l-2 border-line">
      {ordenados.map((item, i) => (
        <li key={`${item.t}-${i}`} className="relative pb-4 pl-5 last:pb-0">
          <span
            className={`absolute top-1 -left-[7px] size-3 rounded-full border-2 border-card ${i === 0 ? 'bg-pri' : 'bg-mut'}`}
            aria-hidden="true"
          />
          <time dateTime={item.t} className="block text-xs font-semibold text-mut">
            {formatarDataHora(item.t)}
          </time>
          <p className="text-sm">{item.texto}</p>
        </li>
      ))}
    </ol>
  )
}
