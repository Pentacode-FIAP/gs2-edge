import { infoTipo } from '../domain/tipos'
import Icone from './Icone'

// Ícone do tipo (energia, sinal, água...) sobre um fundo levemente tingido com a cor do tipo.
export default function SinalTipo({ tipo, tamanho = 'md' }) {
  const info = infoTipo(tipo)
  const classes = tamanho === 'lg' ? 'size-12 [&_svg]:size-6' : 'size-10 [&_svg]:size-5'
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg ${classes}`}
      style={{ color: info.cor, backgroundColor: `color-mix(in srgb, ${info.cor} 13%, transparent)` }}
    >
      <Icone nome={info.icone} titulo={info.rotulo} />
    </span>
  )
}
