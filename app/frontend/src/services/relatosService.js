// Acesso aos relatos de morador na API externa (MockAPI.io).
// Único arquivo que conhece a URL e o formato HTTP do CRUD de relatos.
import { API_RELATOS_URL } from '../config'
import { ErroApi, requisitar } from './http'

const URL_RELATOS = `${API_RELATOS_URL}/relatos`

// GET /relatos — o MockAPI responde 404 quando a lista está vazia; tratamos como lista vazia.
export async function listarRelatos() {
  try {
    const relatos = await requisitar(URL_RELATOS)
    return Array.isArray(relatos) ? relatos : []
  } catch (erro) {
    if (erro instanceof ErroApi && erro.status === 404) return []
    throw erro
  }
}

// GET /relatos/:id
export function buscarRelato(id) {
  return requisitar(`${URL_RELATOS}/${encodeURIComponent(id)}`)
}

// POST /relatos
export function criarRelato(relato) {
  return requisitar(URL_RELATOS, { metodo: 'POST', corpo: relato })
}

// PUT /relatos/:id
export function atualizarRelato(id, relato) {
  return requisitar(`${URL_RELATOS}/${encodeURIComponent(id)}`, { metodo: 'PUT', corpo: relato })
}

// DELETE /relatos/:id
export function excluirRelato(id) {
  return requisitar(`${URL_RELATOS}/${encodeURIComponent(id)}`, { metodo: 'DELETE' })
}
