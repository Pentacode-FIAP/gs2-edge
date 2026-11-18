// Resumo do bairro e relatório: quanto tempo o bairro ficou sem cada serviço.
// Conta relatos validados pela comunidade (confirmados, ou encerrados depois de confirmados)
// e os alertas dos sensores. Funções puras.
import { REGRAS } from '../config'
import { TIPOS } from './tipos'
import { formatarDuracao, minutosEntre } from './tempo'

// Trânsito não tem "horas sem serviço": conta só a quantidade de avisos (como no protótipo).
export const TIPOS_COM_HORAS = ['agua', 'alagamento', 'energia', 'sinal']
export const TIPOS_DO_RESUMO = [...TIPOS_COM_HORAS, 'transito']

const DIA_MS = 24 * 60 * 60 * 1000

export function foiValidado(relato) {
  return relato.status === 'confirmado' || (relato.confirmacoes ?? 0) >= REGRAS.confirmacoesParaConfirmar
}

// Minutos de um aviso dentro da janela [inicioJanela, agora].
function minutosNaJanela(aviso, inicioJanela, agora) {
  const inicio = new Date(Math.max(new Date(aviso.desde).getTime(), inicioJanela.getTime()))
  const fim = aviso.encerradoEm ? new Date(aviso.encerradoEm) : agora
  return fim > inicio ? minutosEntre(inicio, fim) : 0
}

export function resumirBairro(alertasSensor, relatos, agora = new Date(), dias = REGRAS.diasDoResumo) {
  const inicioJanela = new Date(agora.getTime() - dias * DIA_MS)

  const avisos = [
    ...alertasSensor.filter((a) => a.tipo !== 'sensor'),
    ...relatos.filter(foiValidado),
  ].filter((a) => (a.encerradoEm ? new Date(a.encerradoEm) : agora) >= inicioJanela)

  const porTipo = TIPOS_DO_RESUMO.map((tipo) => {
    const doTipo = avisos.filter((a) => a.tipo === tipo)
    const minutos = TIPOS_COM_HORAS.includes(tipo)
      ? doTipo.reduce((soma, a) => soma + minutosNaJanela(a, inicioJanela, agora), 0)
      : null
    return { tipo, rotulo: TIPOS[tipo].rotulo, minutos, avisos: doTipo.length }
  }).sort((a, b) => (b.minutos ?? -1) - (a.minutos ?? -1))

  const minutosTotal = porTipo.reduce((soma, t) => soma + (t.minutos ?? 0), 0)

  return {
    dias,
    minutosTotal,
    totalAvisos: avisos.length,
    tiposComRegistro: porTipo.filter((t) => t.avisos > 0).length,
    porTipo,
    piorDia: calcularPiorDia(avisos, inicioJanela, agora),
    avisos,
  }
}

// Dia com mais minutos sem serviço. Cada aviso é dividido pelos dias em que aconteceu,
// para um problema de 3 dias não contar inteiro no dia em que começou.
function calcularPiorDia(avisos, inicioJanela, agora) {
  const dias = {}
  for (const aviso of avisos) {
    if (!TIPOS_COM_HORAS.includes(aviso.tipo)) continue
    let inicio = new Date(Math.max(new Date(aviso.desde), inicioJanela))
    const fim = aviso.encerradoEm ? new Date(aviso.encerradoEm) : agora
    while (inicio < fim) {
      const meiaNoite = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 1)
      const corte = meiaNoite < fim ? meiaNoite : fim
      // Data local no formato AAAA-MM-DD (o locale sueco usa esse formato).
      const chave = inicio.toLocaleDateString('sv-SE')
      dias[chave] ??= { data: chave, minutos: 0, tipos: new Set() }
      dias[chave].minutos += minutosEntre(inicio, corte)
      dias[chave].tipos.add(aviso.tipo)
      inicio = corte
    }
  }
  const pior = Object.values(dias).sort((a, b) => b.minutos - a.minutos)[0]
  if (!pior || pior.minutos === 0) return null
  return { data: pior.data, minutos: pior.minutos, tipos: [...pior.tipos] }
}

export const minutosParaHoras = (minutos) => Math.round((minutos / 60) * 10) / 10

const NOME_NO_TEXTO = { energia: 'sem energia', agua: 'sem água', sinal: 'sem sinal de celular', alagamento: 'com rua alagada' }

// Texto pronto para mandar à ouvidoria (tela Relatório).
export function montarTextoReclamacao(resumo, nomeBairro) {
  const partes = resumo.porTipo
    .filter((t) => t.minutos > 0)
    .map((t) => `${formatarDuracao(t.minutos)} ${NOME_NO_TEXTO[t.tipo]}`)

  if (partes.length === 0) {
    return `Nos últimos ${resumo.dias} dias não houve falta de serviço confirmada no ${nomeBairro} pelo Vizi.`
  }

  const lista = partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(', ')} e ${partes.at(-1)}`
  return (
    `Moradores do ${nomeBairro} ficaram ${lista} nos últimos ${resumo.dias} dias, ` +
    'segundo avisos confirmados pela comunidade e sensores do Vizi. ' +
    'Pedimos providências e uma previsão para a normalização do serviço.'
  )
}

// CSV com um aviso por linha (separador ";" abre direto no Excel em português).
export function gerarCsv(avisos, agora = new Date()) {
  const colunas = ['id', 'tipo', 'titulo', 'local', 'inicio', 'fim', 'minutos', 'fonte', 'status', 'gravidade', 'confirmacoes', 'negacoes']
  const escapar = (valor) => {
    const texto = valor === null || valor === undefined ? '' : String(valor)
    return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
  }
  const linhas = avisos.map((a) =>
    [
      a.id,
      a.tipo,
      a.titulo,
      a.local,
      a.desde,
      a.encerradoEm ?? '',
      minutosEntre(a.desde, a.encerradoEm ?? agora),
      a.fonte,
      a.status,
      a.gravidade,
      a.confirmacoes ?? '',
      a.negacoes ?? '',
    ]
      .map(escapar)
      .join(';'),
  )
  return [colunas.join(';'), ...linhas].join('\n')
}
