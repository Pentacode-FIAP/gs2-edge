import { useState } from 'react'
import * as relatosService from '../services/relatosService'
import { useCarregar } from './useCarregar'

// Um relato (tela de detalhe e de edição): carrega por id, salva alterações e exclui.
export function useRelato(id) {
  const { dados: relato, setDados, carregando, erro, recarregar } = useCarregar(
    () => (id ? relatosService.buscarRelato(id) : Promise.resolve(null)),
    id,
  )
  const [salvando, setSalvando] = useState(false)

  async function salvar(novo) {
    setSalvando(true)
    try {
      const atualizado = await relatosService.atualizarRelato(id, novo)
      setDados(atualizado)
      return atualizado
    } finally {
      setSalvando(false)
    }
  }

  // Busca a versão mais recente antes de aplicar a mudança, para não apagar
  // o voto que outro vizinho registrou enquanto esta tela estava aberta.
  async function alterar(transformar) {
    setSalvando(true)
    try {
      const atual = await relatosService.buscarRelato(id)
      const atualizado = await relatosService.atualizarRelato(id, transformar(atual))
      setDados(atualizado)
      return atualizado
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    setSalvando(true)
    try {
      await relatosService.excluirRelato(id)
    } finally {
      setSalvando(false)
    }
  }

  return { relato, carregando, erro, salvando, recarregar, salvar, alterar, excluir }
}
