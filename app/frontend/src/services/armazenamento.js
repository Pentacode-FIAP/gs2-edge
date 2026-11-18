// Acesso ao localStorage com proteção: em aba anônima ou com armazenamento bloqueado,
// o app continua funcionando, só não lembra as preferências.

export function lerLocal(chave, padrao) {
  try {
    const bruto = window.localStorage.getItem(chave)
    return bruto === null ? padrao : JSON.parse(bruto)
  } catch {
    return padrao
  }
}

export function salvarLocal(chave, valor) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor))
  } catch {
    // sem armazenamento disponível: ignora
  }
}
