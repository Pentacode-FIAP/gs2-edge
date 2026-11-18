import { useCallback, useEffect, useRef, useState } from 'react'

// Hook genérico de carregamento assíncrono: chama `buscar` ao montar (e quando `chave` muda)
// e devolve dados, estado de carregamento, erro e uma função para tentar de novo.
// Com `intervaloMs`, busca de novo nesse intervalo, em silêncio (sem voltar para "carregando"),
// para as telas de sensor acompanharem o ESP32 ao vivo.
export function useCarregar(buscar, chave = '', { intervaloMs } = {}) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [tentativa, setTentativa] = useState(0)

  // guarda a versão mais recente de `buscar` para o timer não usar uma função antiga
  const buscarRef = useRef(buscar)
  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
    let cancelado = false // evita gravar resposta antiga se o componente saiu da tela
    setCarregando(true)
    setErro(null)

    buscarRef
      .current()
      .then((resultado) => {
        if (!cancelado) setDados(resultado)
      })
      .catch((e) => {
        if (!cancelado) setErro(e)
      })
      .finally(() => {
        if (!cancelado) setCarregando(false)
      })

    if (!intervaloMs) {
      return () => {
        cancelado = true
      }
    }

    const timer = setInterval(() => {
      buscarRef
        .current()
        .then((resultado) => {
          if (cancelado) return
          setDados(resultado)
          setErro(null)
        })
        .catch((e) => {
          if (!cancelado) setErro(e)
        })
    }, intervaloMs)

    return () => {
      cancelado = true
      clearInterval(timer)
    }
  }, [chave, tentativa, intervaloMs])

  const recarregar = useCallback(() => setTentativa((n) => n + 1), [])

  return { dados, setDados, carregando, erro, recarregar }
}
