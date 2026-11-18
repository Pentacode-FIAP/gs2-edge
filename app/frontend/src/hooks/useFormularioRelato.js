import { useState } from 'react'
import { validarRelato } from '../domain/relatos'

const VAZIO = { tipo: '', gravidade: '', local: '', lat: null, lng: null, descricao: '' }

// Estado e validação do formulário "Avisar" (criação e edição).
export function useFormularioRelato(inicial = VAZIO) {
  const [form, setForm] = useState(inicial)
  const [erros, setErros] = useState({})
  const [tentouEnviar, setTentouEnviar] = useState(false)

  function alterar(campos) {
    const novo = { ...form, ...campos }
    setForm(novo)
    // Depois da primeira tentativa, revalida a cada mudança para o erro sumir assim que corrigido.
    if (tentouEnviar) setErros(validarRelato(novo))
  }

  // Devolve true se pode enviar.
  function validar() {
    setTentouEnviar(true)
    const encontrados = validarRelato(form)
    setErros(encontrados)
    return Object.keys(encontrados).length === 0
  }

  return { form, erros, alterar, validar }
}
