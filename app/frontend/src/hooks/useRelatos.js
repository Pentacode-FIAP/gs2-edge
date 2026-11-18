import { useState } from 'react'
import * as relatosService from '../services/relatosService'
import { useCarregar } from './useCarregar'

// Lista de relatos de morador + operações de CRUD, mantendo a lista local em dia.
export function useRelatos() {
  const { dados, setDados, carregando, erro, recarregar } = useCarregar(relatosService.listarRelatos)
  const [salvando, setSalvando] = useState(false)
  const relatos = dados ?? []

  async function executar(acao) {
    setSalvando(true)
    try {
      return await acao()
    } finally {
      setSalvando(false)
    }
  }

  const criar = (relato) =>
    executar(async () => {
      const criado = await relatosService.criarRelato(relato)
      setDados((lista) => [...(lista ?? []), criado])
      return criado
    })

  const atualizar = (id, relato) =>
    executar(async () => {
      const atualizado = await relatosService.atualizarRelato(id, relato)
      setDados((lista) => (lista ?? []).map((r) => (r.id === id ? atualizado : r)))
      return atualizado
    })

  const excluir = (id) =>
    executar(async () => {
      await relatosService.excluirRelato(id)
      setDados((lista) => (lista ?? []).filter((r) => r.id !== id))
    })

  return { relatos, carregando, erro, salvando, recarregar, criar, atualizar, excluir }
}
