import { Link } from 'react-router'

const VARIANTES = {
  primario: 'bg-pri text-on-pri hover:bg-pri-d',
  secundario: 'bg-pri-l text-pri-d hover:brightness-95',
  contorno: 'border border-line bg-card text-ink hover:border-mut',
  perigo: 'border border-bad/40 bg-card text-bad hover:bg-badbg',
}

// Botão padrão do app. Com `para`, vira link de navegação com a mesma aparência.
export default function Botao({ variante = 'primario', para, className = '', children, ...props }) {
  const classes = `inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 py-3 text-[15px] font-bold transition-[background-color,border-color,filter] duration-150 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 ${VARIANTES[variante]} ${className}`

  if (para) {
    return (
      <Link to={para} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
