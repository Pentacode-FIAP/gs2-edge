// Acesso aos dados dos sensores Vizi.
//
// Entrega de Edge: as funções leem a API Vizi real (FastAPI em ../backend), que busca os dados
// no FIWARE (Orion + STH-Comet). O formato é o de docs/contrato-dados.md, o mesmo da imitação em
// ./mock/apiViziFake.js, que continua disponível com VITE_SENSORES_MOCK=true.
import { API_VIZI_URL, SENSORES_MOCK } from '../config'
import { ErroApi, requisitar } from './http'
import { getAlerta, getAlertas, getSensores } from './mock/apiViziFake'

const ALERTA_ENCERRADO = 'Esse alerta não está mais ativo: o serviço voltou ao normal.'

export async function listarSensores() {
  if (SENSORES_MOCK) return getSensores()
  return requisitar(`${API_VIZI_URL}/api/sensores`)
}

export async function listarAlertasSensor() {
  if (SENSORES_MOCK) return getAlertas()
  return requisitar(`${API_VIZI_URL}/api/alertas`)
}

export async function buscarAlertaSensor(id) {
  if (SENSORES_MOCK) {
    const alerta = getAlerta(id)
    if (!alerta) throw new ErroApi(ALERTA_ENCERRADO, 404)
    return alerta
  }
  try {
    return await requisitar(`${API_VIZI_URL}/api/alertas/${encodeURIComponent(id)}`)
  } catch (erro) {
    // A API devolve 404 quando o serviço já voltou ao normal.
    if (erro instanceof ErroApi && erro.status === 404) throw new ErroApi(ALERTA_ENCERRADO, 404)
    throw erro
  }
}
