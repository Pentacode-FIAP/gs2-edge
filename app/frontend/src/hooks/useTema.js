import { useEffect, useState } from 'react'
import { lerLocal, salvarLocal } from '../services/armazenamento'

const CHAVE = 'vizi:tema'

function temaDoSistema() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro'
}

// Tema claro/escuro. Começa pelo tema do sistema e lembra a escolha do usuário.
export function useTema() {
  const [tema, setTema] = useState(() => lerLocal(CHAVE, null) ?? temaDoSistema())

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema === 'escuro' ? 'dark' : 'light')
  }, [tema])

  function alternarTema() {
    setTema((atual) => {
      const novo = atual === 'escuro' ? 'claro' : 'escuro'
      salvarLocal(CHAVE, novo)
      return novo
    })
  }

  return { tema, alternarTema }
}
