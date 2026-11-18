import { REGRAS } from '../config'
import Botao from './Botao'

// "Isso ainda acontece aí?": a comunidade valida o aviso. Um voto por aparelho.
export default function PainelVoto({ relato, votoAnterior, ehAutor, salvando, aoVotar }) {
  const encerrado = relato.status === 'resolvido'
  const faltam = Math.max(0, REGRAS.confirmacoesParaConfirmar - (relato.confirmacoes ?? 0))

  let mensagem = 'Um voto por aparelho.'
  if (encerrado) mensagem = 'Aviso encerrado: o serviço voltou.'
  else if (ehAutor) mensagem = 'Você fez este aviso. Peça para um vizinho confirmar.'
  else if (votoAnterior === 'sim') mensagem = 'Você confirmou que ainda está acontecendo. Obrigado!'
  else if (votoAnterior === 'nao') mensagem = 'Você avisou que já voltou. Obrigado!'

  const bloqueado = encerrado || ehAutor || Boolean(votoAnterior) || salvando

  return (
    <section aria-labelledby="titulo-voto" className="rounded-lg border border-line bg-card p-4">
      <h2 id="titulo-voto" className="font-bold">
        Isso ainda acontece aí?
      </h2>
      <p className="text-sm text-mut">
        {relato.confirmacoes ?? 0} {relato.confirmacoes === 1 ? 'confirmação' : 'confirmações'} · {relato.negacoes ?? 0}{' '}
        {relato.negacoes === 1 ? 'negação' : 'negações'}
        {relato.status === 'aberto' && faltam > 0 && ` · faltam ${faltam} para confirmar`}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Botao onClick={() => aoVotar('sim')} disabled={bloqueado}>
          Sim, ainda
        </Botao>
        <Botao variante="contorno" onClick={() => aoVotar('nao')} disabled={bloqueado}>
          Já voltou
        </Botao>
      </div>
      <p className="mt-2 text-sm text-mut" aria-live="polite">
        {mensagem}
      </p>
    </section>
  )
}
