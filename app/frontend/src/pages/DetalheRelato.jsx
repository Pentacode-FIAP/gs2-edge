import { useNavigate, useParams } from 'react-router'
import AcoesAutor from '../components/AcoesAutor'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { Carregando, Erro } from '../components/Estados'
import LinhaDoTempo from '../components/LinhaDoTempo'
import MapaBairro from '../components/MapaBairro'
import PainelVoto from '../components/PainelVoto'
import { SeloGravidade, SeloStatus } from '../components/SeloStatus'
import SinalTipo from '../components/SinalTipo'
import { aplicarVoto, ehAutor, encerrarRelato, estaAtivo, podeVotar } from '../domain/relatos'
import { formatarDuracao, minutosEntre } from '../domain/tempo'
import { useAgora } from '../hooks/useAgora'
import { useAparelho } from '../hooks/useAparelho'
import { useRelato } from '../hooks/useRelato'
import { useToast } from '../hooks/useToast'

export default function DetalheRelato() {
  const { id } = useParams()
  const { relato, carregando, erro, salvando, recarregar, alterar, excluir } = useRelato(id)
  const { aparelhoId, votoDe, registrarVoto } = useAparelho()
  const mostrarToast = useToast()
  const navegar = useNavigate()
  const agora = useAgora()

  if (carregando) return <Carregando texto="Abrindo aviso…" />
  if (erro) {
    return (
      <>
        <CabecalhoPagina titulo="Aviso" voltarPara="/" rotuloVoltar="Mapa" />
        <Erro erro={erro} aoTentarDeNovo={erro.status === 404 ? undefined : recarregar} />
      </>
    )
  }

  const souAutor = ehAutor(relato, aparelhoId)
  const ativo = estaAtivo(relato)
  const minutos = minutosEntre(relato.desde, relato.encerradoEm ?? agora)

  async function votar(voto) {
    if (!podeVotar(relato, aparelhoId, votoDe(relato.id))) return
    try {
      await alterar((atual) => aplicarVoto(atual, voto))
      registrarVoto(relato.id, voto)
      mostrarToast('Obrigado por ajudar o bairro!')
    } catch (e) {
      mostrarToast(e.message, 'erro')
    }
  }

  async function encerrar() {
    try {
      await alterar(encerrarRelato)
      mostrarToast('Aviso encerrado. Que bom que voltou!')
    } catch (e) {
      mostrarToast(e.message, 'erro')
    }
  }

  async function apagar() {
    try {
      await excluir()
      mostrarToast('Aviso apagado.')
      navegar('/')
    } catch (e) {
      mostrarToast(e.message, 'erro')
    }
  }

  return (
    <>
      <CabecalhoPagina titulo={relato.titulo} subtitulo={`${relato.local} · aviso de morador`} voltarPara="/" rotuloVoltar="Mapa" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex items-center gap-4 rounded-lg border border-line bg-card p-4">
            <SinalTipo tipo={relato.tipo} tamanho="lg" />
            <div>
              <p className="text-sm text-mut">{ativo ? 'Tempo sem serviço até agora' : 'Ficou sem serviço por'}</p>
              <p className="text-3xl font-extrabold tracking-tight">{formatarDuracao(minutos)}</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                <SeloStatus status={relato.status} />
                <SeloGravidade gravidade={relato.gravidade} />
              </div>
            </div>
          </section>

          {relato.descricao && (
            <section className="rounded-lg border border-line bg-card p-4">
              <h2 className="mb-1 font-bold">O que o morador contou</h2>
              <p className="text-[15px]">{relato.descricao}</p>
            </section>
          )}

          <PainelVoto relato={relato} votoAnterior={votoDe(relato.id)} ehAutor={souAutor} salvando={salvando} aoVotar={votar} />

          {souAutor && <AcoesAutor relatoId={relato.id} ativo={ativo} salvando={salvando} aoEncerrar={encerrar} aoExcluir={apagar} />}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <MapaBairro alertas={[relato]} destacadoId={relato.id} className="h-56" />
          <section className="rounded-lg border border-line bg-card p-4">
            <h2 className="mb-3 font-bold">Linha do tempo</h2>
            <LinhaDoTempo itens={relato.linhaDoTempo} />
          </section>
        </div>
      </div>
    </>
  )
}
