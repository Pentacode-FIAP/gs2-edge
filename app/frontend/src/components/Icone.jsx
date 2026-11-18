// Ícones de traço do protótipo, em SVG inline (sem biblioteca externa).
const CAMINHOS = {
  energia: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  sinal: (
    <>
      <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1" />
    </>
  ),
  agua: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  alagamento: (
    <path d="M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4-1.5 6 0M2 14c2.5-2 4.5-2 7 0s4.5 2 7 0 4-1.5 6 0M2 19c2.5-2 4.5-2 7 0s4.5 2 7 0 4-1.5 6 0" />
  ),
  transito: (
    <>
      <path d="M5 16V11l2-5h10l2 5v5M3 16h18M7 16v3M17 16v3" />
      <circle cx="8" cy="13" r=".8" />
      <circle cx="16" cy="13" r=".8" />
    </>
  ),
  sensor: (
    <>
      <path d="M12 12v9M8 21h8" />
      <circle cx="12" cy="9" r="2" />
      <path d="M7.8 4.8a6 6 0 0 0 0 8.4M16.2 4.8a6 6 0 0 1 0 8.4" />
    </>
  ),
  todos: (
    <>
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
    </>
  ),
  mapa: <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" />,
  mais: <path d="M12 5v14M5 12h14" />,
  grafico: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  documento: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7" />,
  sino: <path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" />,
  busca: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.5-4.5" />
    </>
  ),
  voltar: <path d="m15 18-6-6 6-6" />,
  local: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  lua: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  sol: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  editar: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  lixeira: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  copiar: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </>
  ),
  baixar: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  check: <path d="m5 12 5 5 9-10" />,
  alerta: <path d="M12 3 2 20h20zM12 10v4M12 17h.01" />,
  recarregar: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
}

export default function Icone({ nome, className = 'size-5', titulo }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={titulo ? undefined : true}
      role={titulo ? 'img' : undefined}
    >
      {titulo && <title>{titulo}</title>}
      {CAMINHOS[nome] ?? CAMINHOS.alerta}
    </svg>
  )
}
