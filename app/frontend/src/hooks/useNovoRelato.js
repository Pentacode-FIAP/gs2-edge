import { useState } from 'react'
import { montarNovoRelato } from '../domain/relatos'
import { criarRelato } from '../services/relatosService'
import { useAparelho } from './useAparelho'

// Cria um relato a partir do formulário, marcando este aparelho como autor.
export function useNovoRelato() {
  const { aparelhoId } = useAparelho()
  const [salvando, setSalvando] = useState(false)

  async function criar(form) {
    setSalvando(true)
    try {
      return await criarRelato(montarNovoRelato(form, aparelhoId))
    } finally {
      setSalvando(false)
    }
  }

  return { criar, salvando }
}
