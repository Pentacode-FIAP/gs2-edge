// Cliente HTTP mínimo sobre fetch: JSON, tempo limite e mensagens de erro em português.

const TEMPO_LIMITE_MS = 10000

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem)
    this.name = 'ErroApi'
    this.status = status
  }
}

function mensagemPorStatus(status) {
  if (status === 404) return 'Não encontramos esse aviso. Talvez ele já tenha sido apagado.'
  if (status === 429) return 'Muitas tentativas seguidas. Espere alguns segundos e tente de novo.'
  if (status >= 500) return 'O servidor está com problema agora. Tente de novo em instantes.'
  return 'Não foi possível concluir. Tente de novo.'
}

export async function requisitar(url, { metodo = 'GET', corpo } = {}) {
  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), TEMPO_LIMITE_MS)

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: corpo ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controle.signal,
    })

    if (!resposta.ok) throw new ErroApi(mensagemPorStatus(resposta.status), resposta.status)
    return await resposta.json()
  } catch (erro) {
    if (erro instanceof ErroApi) throw erro
    if (erro.name === 'AbortError') throw new ErroApi('A conexão está lenta. Confira a internet e tente de novo.', 0)
    throw new ErroApi('Sem conexão com o servidor. Confira a internet e tente de novo.', 0)
  } finally {
    clearTimeout(timer)
  }
}
