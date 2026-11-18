import { useMemo, useState } from 'react'
import { contarPorTipo, filtrarAlertas, juntarAlertas } from '../domain/alertas'
import { ATUALIZAR_SENSORES_MS } from '../config'
import { listarAlertasSensor } from '../services/sensoresService'
import { useCarregar } from './useCarregar'
import { useRelatos } from './useRelatos'

// Tudo que o mapa precisa: alertas de sensor + relatos ativos, já filtrados por tipo e busca.
export function useAlertas() {
  const sensores = useCarregar(listarAlertasSensor, '', { intervaloMs: ATUALIZAR_SENSORES_MS })
  const { relatos, carregando: carregandoRelatos, erro: erroRelatos, recarregar: recarregarRelatos } = useRelatos()
  const [tipo, setTipo] = useState('todos')
  const [busca, setBusca] = useState('')

  const todos = useMemo(() => juntarAlertas(sensores.dados ?? [], relatos), [sensores.dados, relatos])
  const alertas = useMemo(() => filtrarAlertas(todos, { tipo, busca }), [todos, tipo, busca])
  const contagem = useMemo(() => contarPorTipo(todos), [todos])

  function recarregar() {
    sensores.recarregar()
    recarregarRelatos()
  }

  return {
    alertas,
    total: todos.length,
    contagem,
    tipo,
    setTipo,
    busca,
    setBusca,
    carregando: sensores.carregando || carregandoRelatos,
    erroSensores: sensores.erro,
    erroRelatos,
    recarregar,
  }
}
