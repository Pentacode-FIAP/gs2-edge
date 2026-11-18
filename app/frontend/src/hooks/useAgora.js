import { useEffect, useState } from 'react'

// Hora atual que se atualiza sozinha (padrão: a cada 30 s),
// para contadores como "Tempo sem serviço até agora" andarem com a tela aberta.
export function useAgora(intervaloMs = 30000) {
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), intervaloMs)
    return () => clearInterval(timer)
  }, [intervaloMs])

  return agora
}
