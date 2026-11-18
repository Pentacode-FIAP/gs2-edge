// Junta alertas de sensor e relatos de morador numa lista só (o contrato usa os mesmos campos),
// e aplica filtro e ordenação usados no mapa e na lista.
import { estaAtivo } from './relatos'

export function juntarAlertas(alertasSensor, relatos) {
  const ativos = relatos.filter(estaAtivo)
  return ordenarAlertas([...alertasSensor, ...ativos])
}

// Gravidade alta primeiro; depois confirmados; depois os mais recentes. Igual à API Vizi + status.
export function ordenarAlertas(alertas) {
  const pesoGravidade = { alta: 0, media: 1, baixa: 2 }
  return [...alertas].sort((a, b) => {
    const g = (pesoGravidade[a.gravidade] ?? 3) - (pesoGravidade[b.gravidade] ?? 3)
    if (g !== 0) return g
    const c = (b.status === 'confirmado') - (a.status === 'confirmado')
    if (c !== 0) return c
    return new Date(b.desde) - new Date(a.desde)
  })
}

export function filtrarAlertas(alertas, { tipo = 'todos', busca = '' } = {}) {
  const termo = normalizar(busca)
  return alertas.filter((alerta) => {
    if (tipo !== 'todos' && alerta.tipo !== tipo) return false
    if (!termo) return true
    return normalizar(`${alerta.titulo} ${alerta.local}`).includes(termo)
  })
}

export function contarPorTipo(alertas) {
  return alertas.reduce((contagem, alerta) => {
    contagem[alerta.tipo] = (contagem[alerta.tipo] ?? 0) + 1
    return contagem
  }, {})
}

// Rota de detalhe: alerta de sensor e relato têm telas diferentes.
export function linkDoAlerta(alerta) {
  return alerta.fonte === 'sensor' ? `/alertas/${alerta.id}` : `/relatos/${alerta.id}`
}

function normalizar(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
