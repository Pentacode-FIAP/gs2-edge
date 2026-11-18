import { Link } from 'react-router'
import Icone from './Icone'

export default function CabecalhoPagina({ titulo, subtitulo, voltarPara, rotuloVoltar = 'Voltar', children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {voltarPara && (
          <Link to={voltarPara} className="mb-1 inline-flex items-center gap-1 text-sm font-semibold text-pri">
            <Icone nome="voltar" className="size-4" />
            {rotuloVoltar}
          </Link>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="text-sm text-mut">{subtitulo}</p>}
      </div>
      {children}
    </div>
  )
}
