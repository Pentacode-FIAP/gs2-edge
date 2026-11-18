import { FILTROS_MAPA, infoTipo } from '../domain/tipos'

// Filtros do mapa ("Todos", "Energia", "Sinal"...), com a quantidade de cada tipo.
// No celular rolam na horizontal dentro da própria faixa, sem empurrar a página.
export default function FiltroTipos({ selecionado, aoSelecionar, contagem = {}, total = 0 }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div role="group" aria-label="Filtrar por tipo" className="flex w-max gap-2">
        {FILTROS_MAPA.map((tipo) => {
          const ativo = selecionado === tipo
          const rotulo = tipo === 'todos' ? 'Todos' : infoTipo(tipo).rotulo
          const quantidade = tipo === 'todos' ? total : (contagem[tipo] ?? 0)
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={ativo}
              onClick={() => aoSelecionar(tipo)}
              className={`flex min-h-11 items-center gap-2 rounded-lg border px-3.5 text-[15px] font-semibold transition-colors ${
                ativo ? 'border-ink bg-ink text-card' : 'border-line bg-card text-ink hover:border-mut'
              }`}
            >
              {tipo !== 'todos' && (
                <span className="size-2.5 rounded-full" style={{ backgroundColor: infoTipo(tipo).cor }} aria-hidden="true" />
              )}
              {rotulo}
              <span className={`tabular-nums ${ativo ? 'opacity-70' : 'text-mut'}`}>{quantidade}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
