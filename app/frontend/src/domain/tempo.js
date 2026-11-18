// Funções puras de data e duração, usadas em várias telas.

const MINUTO = 60 * 1000

export function minutosEntre(inicio, fim = new Date()) {
  const diff = new Date(fim).getTime() - new Date(inicio).getTime()
  return Math.max(0, Math.round(diff / MINUTO))
}

// 130 -> "2 h 10 min"
export function formatarDuracao(minutos) {
  if (minutos < 1) return 'menos de 1 min'
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${m} min`
}

// Data ISO -> "há 2 h"
export function formatarHaQuanto(iso, agora = new Date()) {
  const min = minutosEntre(iso, agora)
  if (min < 1) return 'agora mesmo'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'há 1 dia' : `há ${d} dias`
}

// Data ISO -> "14:12"
export function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

// Data ISO -> "12/11, 14:12"
export function formatarDataHora(iso) {
  const d = new Date(iso)
  const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return `${data}, ${formatarHora(iso)}`
}

export function formatarNumero(valor, casas = 1) {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })
}
