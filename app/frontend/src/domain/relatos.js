// Regras de negócio dos relatos de morador. Funções puras: recebem dados, devolvem dados novos.
// Nada aqui faz requisição nem mexe em tela.
import { REGRAS } from '../config'
import { TIPOS, TIPOS_RELATO, GRAVIDADES } from './tipos'

export const LIMITE_DESCRICAO = 280

const evento = (agora, texto) => ({ t: agora.toISOString(), texto })

// RN: campos obrigatórios e limites do formulário "Avisar".
export function validarRelato(form) {
  const erros = {}
  if (!TIPOS_RELATO.includes(form.tipo)) erros.tipo = 'Escolha o que está faltando.'
  if (!GRAVIDADES[form.gravidade]) erros.gravidade = 'Escolha a gravidade.'
  if (!form.local || form.local.trim().length < 3) erros.local = 'Diga a rua ou um ponto de referência.'
  if (typeof form.lat !== 'number' || typeof form.lng !== 'number') erros.posicao = 'Marque o lugar no mapa.'
  if ((form.descricao ?? '').length > LIMITE_DESCRICAO) {
    erros.descricao = `Use no máximo ${LIMITE_DESCRICAO} caracteres.`
  }
  return erros
}

// Monta o relato no formato do contrato (mesmos campos de Alerta + extras do morador).
export function montarNovoRelato(form, autorId, agora = new Date()) {
  return {
    tipo: form.tipo,
    titulo: TIPOS[form.tipo].titulo,
    local: form.local.trim(),
    lat: form.lat,
    lng: form.lng,
    desde: agora.toISOString(),
    gravidade: form.gravidade,
    status: 'aberto',
    fonte: 'morador',
    sensorId: null,
    valor: null,
    unidade: null,
    descricao: (form.descricao ?? '').trim(),
    confirmacoes: 0,
    negacoes: 0,
    autorId,
    encerradoEm: null,
    linhaDoTempo: [evento(agora, 'Aviso feito por morador')],
  }
}

// O formulário de edição começa com os dados atuais do relato.
export function relatoParaForm(relato) {
  return {
    tipo: relato.tipo,
    gravidade: relato.gravidade,
    local: relato.local,
    lat: relato.lat,
    lng: relato.lng,
    descricao: relato.descricao ?? '',
  }
}

export function aplicarEdicao(relato, form, agora = new Date()) {
  return {
    ...relato,
    tipo: form.tipo,
    titulo: TIPOS[form.tipo].titulo,
    gravidade: form.gravidade,
    local: form.local.trim(),
    lat: form.lat,
    lng: form.lng,
    descricao: (form.descricao ?? '').trim(),
    linhaDoTempo: [...(relato.linhaDoTempo ?? []), evento(agora, 'Aviso atualizado por quem avisou')],
  }
}

export const estaAtivo = (relato) => relato.status !== 'resolvido'

export const ehAutor = (relato, autorId) => Boolean(autorId) && relato.autorId === autorId

// RN: só quem não é autor vota, um voto por aparelho, e só em aviso ativo.
export function podeVotar(relato, autorId, votoAnterior) {
  return estaAtivo(relato) && !ehAutor(relato, autorId) && !votoAnterior
}

// Voto "Sim, ainda" (confirmar) ou "Já voltou" (negar).
// RN1: com REGRAS.confirmacoesParaConfirmar confirmações, o aviso passa de "aberto" para "confirmado".
// RN2: com REGRAS.negacoesParaResolver negações, e mais negações que confirmações, o aviso é encerrado.
export function aplicarVoto(relato, voto, agora = new Date()) {
  const linha = [...(relato.linhaDoTempo ?? [])]
  const novo = { ...relato }

  if (voto === 'sim') {
    novo.confirmacoes = (relato.confirmacoes ?? 0) + 1
    if (relato.status === 'aberto' && novo.confirmacoes >= REGRAS.confirmacoesParaConfirmar) {
      novo.status = 'confirmado'
      linha.push(evento(agora, 'Confirmado por vizinhos'))
    } else {
      linha.push(evento(agora, 'Vizinho confirmou que ainda está acontecendo'))
    }
  } else {
    novo.negacoes = (relato.negacoes ?? 0) + 1
    linha.push(evento(agora, 'Vizinho avisou que já voltou'))
    if (novo.negacoes >= REGRAS.negacoesParaResolver && novo.negacoes > (novo.confirmacoes ?? 0)) {
      novo.status = 'resolvido'
      novo.encerradoEm = agora.toISOString()
      linha.push(evento(agora, 'Encerrado: vizinhos avisaram que o serviço voltou'))
    }
  }

  novo.linhaDoTempo = linha
  return novo
}

// Quem avisou pode encerrar o próprio aviso quando o serviço volta.
export function encerrarRelato(relato, agora = new Date()) {
  return {
    ...relato,
    status: 'resolvido',
    encerradoEm: agora.toISOString(),
    linhaDoTempo: [...(relato.linhaDoTempo ?? []), evento(agora, 'Encerrado por quem avisou: o serviço voltou')],
  }
}
