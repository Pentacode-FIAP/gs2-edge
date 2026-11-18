import { NavLink } from 'react-router'
import Icone from './Icone'

const ITENS = [
  { para: '/', rotulo: 'Mapa', icone: 'mapa' },
  { para: '/avisar', rotulo: 'Avisar', icone: 'mais' },
  { para: '/bairro', rotulo: 'Bairro', icone: 'grafico' },
  { para: '/relatorio', rotulo: 'Relatório', icone: 'documento' },
]

// Mesma navegação em dois formatos: abas no rodapé (celular) e links no topo (telas largas).
export default function BarraNavegacao({ variante = 'abas' }) {
  if (variante === 'topo') {
    return (
      <nav aria-label="Principal" className="flex h-16 items-stretch gap-1">
        {ITENS.map((item) => (
          <NavLink
            key={item.para}
            to={item.para}
            end={item.para === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 border-b-2 px-3 text-[15px] font-semibold transition-colors ${
                isActive ? 'border-pri text-ink' : 'border-transparent text-mut hover:text-ink'
              }`
            }
          >
            <Icone nome={item.icone} className="size-4" />
            {item.rotulo}
          </NavLink>
        ))}
      </nav>
    )
  }

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-[900] grid grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {ITENS.map((item) => (
        <NavLink
          key={item.para}
          to={item.para}
          end={item.para === '/'}
          className={({ isActive }) =>
            `relative flex h-[4.5rem] flex-col items-center justify-center gap-1 text-xs ${
              isActive ? 'font-bold text-pri' : 'font-medium text-mut'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-pri" aria-hidden="true" />}
              <Icone nome={item.icone} className="size-6" />
              {item.rotulo}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
