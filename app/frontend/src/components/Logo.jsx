// Logo do Vizi ("dois vizinhos"): duas linhas que se encontram num ponto.
// As cores vêm dos tokens --marca-*, que mudam no tema escuro (mesmo desenho dos SVGs em public/marca).

function Simbolo() {
  return (
    <>
      <path d="M16 14L38 60" fill="none" stroke="var(--marca-1)" strokeWidth="13" strokeLinecap="round" />
      <path d="M72 14L50 60" fill="none" stroke="var(--marca-2)" strokeWidth="13" strokeLinecap="round" />
      <circle cx="44" cy="72" r="9" fill="var(--marca-3)" />
    </>
  )
}

export default function Logo({ variante = 'completo', className = 'h-8 w-auto' }) {
  if (variante === 'simbolo') {
    return (
      <svg viewBox="0 0 88 88" className={className} role="img" aria-label="Vizi">
        <Simbolo />
      </svg>
    )
  }

  const traco = { fill: 'none', stroke: 'var(--marca-1)', strokeWidth: 9, strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg viewBox="0 0 245 88" className={className} role="img" aria-label="Vizi">
      <Simbolo />
      <g transform="translate(112 5)">
        <path d="M4.5 24L24 72L43.5 24" {...traco} />
        <path d="M64 24V72" {...traco} />
        <path d="M84 24H108L84 72H108" {...traco} />
        <path d="M128 24V72" {...traco} />
        <circle cx="64" cy="7" r="5.5" fill="var(--marca-1)" />
        <circle cx="128" cy="7" r="5.5" fill="var(--marca-3)" />
      </g>
    </svg>
  )
}
