import { useMemo } from 'react'
import { ATUALIZAR_SENSORES_MS, SO_SENSORES, BAIRRO } from '../config'
import { gerarCsv, montarTextoReclamacao, resumirBairro } from '../domain/bairro'
import { listarAlertasSensor } from '../services/sensoresService'
import { useCarregar } from './useCarregar'
import { useRelatos } from './useRelatos'

// Resumo de horas sem serviço, texto de reclamação e CSV (telas Bairro e Relatório).
export function useResumoBairro() {
  const sensores = useCarregar(listarAlertasSensor, '', { intervaloMs: ATUALIZAR_SENSORES_MS })
  const { relatos: todosRelatos, carregando: carregandoRelatos, erro: erroRelatos, recarregar: recarregarRelatos } = useRelatos()
  const relatos = useMemo(() => (SO_SENSORES ? [] : todosRelatos), [todosRelatos])

  const resumo = useMemo(() => resumirBairro(sensores.dados ?? [], relatos), [sensores.dados, relatos])
  const textoReclamacao = useMemo(() => montarTextoReclamacao(resumo, BAIRRO.nome), [resumo])

  function baixarCsv() {
    const csv = gerarCsv(resumo.avisos)
    // BOM no início para o Excel reconhecer os acentos.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vizi-${BAIRRO.nome.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function recarregar() {
    sensores.recarregar()
    recarregarRelatos()
  }

  return {
    resumo,
    textoReclamacao,
    baixarCsv,
    carregando: sensores.carregando || carregandoRelatos,
    erro: sensores.erro ?? erroRelatos,
    recarregar,
  }
}
