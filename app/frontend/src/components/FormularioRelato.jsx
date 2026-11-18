import { LIMITE_DESCRICAO } from '../domain/relatos'
import { useFormularioRelato } from '../hooks/useFormularioRelato'
import Botao from './Botao'
import SeletorGravidade from './SeletorGravidade'
import SeletorLocal from './SeletorLocal'
import SeletorTipo from './SeletorTipo'

// Formulário de aviso: três escolhas (tipo, gravidade, lugar) e um detalhe opcional.
export default function FormularioRelato({ inicial, rotuloEnviar, salvando, aoEnviar, rodape }) {
  const { form, erros, alterar, validar } = useFormularioRelato(inicial)

  function enviar(evento) {
    evento.preventDefault()
    if (validar()) aoEnviar(form)
  }

  const posicao = form.lat !== null && form.lng !== null ? { lat: form.lat, lng: form.lng } : null

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
      <SeletorTipo valor={form.tipo} aoMudar={(tipo) => alterar({ tipo })} erro={erros.tipo} />
      <SeletorGravidade valor={form.gravidade} aoMudar={(gravidade) => alterar({ gravidade })} erro={erros.gravidade} />
      <SeletorLocal
        local={form.local}
        posicao={posicao}
        aoMudarLocal={(local) => alterar({ local })}
        aoMudarPosicao={(lat, lng) => alterar({ lat, lng })}
        erros={erros}
      />

      <div>
        <label htmlFor="descricao" className="mb-2 block text-sm font-bold">
          Quer contar mais? <span className="font-normal text-mut">(opcional)</span>
        </label>
        <textarea
          id="descricao"
          value={form.descricao}
          onChange={(e) => alterar({ descricao: e.target.value })}
          rows={3}
          maxLength={LIMITE_DESCRICAO}
          placeholder="Ex.: caiu depois da chuva, o poste da esquina está piscando."
          className="w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base outline-none placeholder:text-mut focus:border-pri"
        />
        <p className="text-right text-xs text-mut">
          {form.descricao.length}/{LIMITE_DESCRICAO}
        </p>
        <p className="text-sm text-mut">Não escreva nome, telefone ou outros dados pessoais.</p>
      </div>

      <div className="flex flex-col gap-2">
        <Botao type="submit" disabled={salvando} className="w-full">
          {salvando ? 'Enviando…' : rotuloEnviar}
        </Botao>
        {rodape}
      </div>
    </form>
  )
}
