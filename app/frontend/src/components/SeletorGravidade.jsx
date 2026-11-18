import { GRAVIDADES } from '../domain/tipos'

const DICAS = {
  baixa: 'Atrapalha, mas dá para levar.',
  media: 'Atrapalha a rotina de muita gente.',
  alta: 'Risco ou serviço parado de vez.',
}

// "Qual a gravidade?": controle segmentado Leve / Média / Alta.
export default function SeletorGravidade({ valor, aoMudar, erro }) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">Qual a gravidade?</legend>
      <div className="grid grid-cols-3 overflow-hidden rounded-lg border-[1.5px] border-line">
        {Object.values(GRAVIDADES).map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={valor === g.id}
            onClick={() => aoMudar(g.id)}
            className={`min-h-12 text-[15px] font-semibold transition-colors not-last:border-r border-line ${
              valor === g.id ? 'bg-pri text-on-pri' : 'bg-card hover:bg-pri-l'
            }`}
          >
            {g.rotulo}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-sm text-mut">{valor ? DICAS[valor] : 'Escolha uma opção.'}</p>
      {erro && <p className="text-sm font-semibold text-bad">{erro}</p>}
    </fieldset>
  )
}
