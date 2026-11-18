import { TIPOS_RELATO, infoTipo } from '../domain/tipos'
import Icone from './Icone'

// "O que está faltando?": blocos grandes, fáceis de tocar.
export default function SeletorTipo({ valor, aoMudar, erro }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">O que está faltando?</legend>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {TIPOS_RELATO.map((tipo) => {
          const info = infoTipo(tipo)
          const ativo = valor === tipo
          return (
            <button
              key={tipo}
              type="button"
              aria-pressed={ativo}
              onClick={() => aoMudar(tipo)}
              className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] px-1 text-sm font-semibold transition-colors ${
                ativo ? 'border-pri bg-pri-l' : 'border-line bg-card hover:border-pri'
              }`}
            >
              <span style={{ color: info.cor }}>
                <Icone nome={info.icone} className="size-7" />
              </span>
              {info.rotulo}
            </button>
          )
        })}
      </div>
      {erro && <p className="mt-1.5 text-sm font-semibold text-bad">{erro}</p>}
    </fieldset>
  )
}
