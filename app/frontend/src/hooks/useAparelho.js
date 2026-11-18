import { useState } from 'react'
import { lerLocal, salvarLocal } from '../services/armazenamento'

const CHAVE_ID = 'vizi:aparelho'
const CHAVE_VOTOS = 'vizi:votos'

function obterIdDoAparelho() {
  let id = lerLocal(CHAVE_ID, null)
  if (!id) {
    id = crypto.randomUUID?.() ?? `ap-${Date.now()}-${Math.random().toString(36).slice(2)}`
    salvarLocal(CHAVE_ID, id)
  }
  return id
}

// Identidade anônima do aparelho: sem login e sem dado pessoal.
// Serve para "um voto por aparelho" e para saber quais avisos este aparelho criou.
export function useAparelho() {
  const [aparelhoId] = useState(obterIdDoAparelho)
  const [votos, setVotos] = useState(() => lerLocal(CHAVE_VOTOS, {}))

  function votoDe(relatoId) {
    return votos[relatoId] ?? null
  }

  function registrarVoto(relatoId, voto) {
    setVotos((atuais) => {
      const novos = { ...atuais, [relatoId]: voto }
      salvarLocal(CHAVE_VOTOS, novos)
      return novos
    })
  }

  return { aparelhoId, votoDe, registrarVoto }
}
