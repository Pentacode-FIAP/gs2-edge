import { useParams } from 'react-router'
import Botao from '../components/Botao'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { Carregando, Erro } from '../components/Estados'
import GraficoSerie from '../components/GraficoSerie'
import LinhaDoTempo from '../components/LinhaDoTempo'
import MapaBairro from '../components/MapaBairro'
import { SeloFonte, SeloGravidade } from '../components/SeloStatus'
import SinalTipo from '../components/SinalTipo'
import { formatarDuracao, formatarNumero, minutosEntre } from '../domain/tempo'
import { useAgora } from '../hooks/useAgora'
import { useAlertaSensor } from '../hooks/useAlertaSensor'

export default function DetalheAlertaSensor() {
  const { id } = useParams()
  const { alerta, carregando, erro, recarregar } = useAlertaSensor(id)
  const agora = useAgora()

  if (carregando) return <Carregando texto="Lendo o sensor…" />
  if (erro) {
    return (
      <>
        <CabecalhoPagina titulo="Alerta do sensor" voltarPara="/" rotuloVoltar="Mapa" />
        <Erro erro={erro} aoTentarDeNovo={erro.status === 404 ? undefined : recarregar} />
      </>
    )
  }

  const semComunicacao = alerta.tipo === 'sensor'

  return (
    <>
      <CabecalhoPagina titulo={alerta.titulo} subtitulo={`${alerta.local} · sensor ${alerta.sensorId}`} voltarPara="/" rotuloVoltar="Mapa" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex items-center gap-4 rounded-lg border border-line bg-card p-4">
            <SinalTipo tipo={alerta.tipo} tamanho="lg" />
            <div>
              <p className="text-sm text-mut">{semComunicacao ? 'Última leitura recebida' : 'Detectado pelo sensor há'}</p>
              <p className="text-3xl font-extrabold tracking-tight">{formatarDuracao(minutosEntre(alerta.desde, agora))}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <SeloFonte fonte="sensor" />
                <SeloGravidade gravidade={alerta.gravidade} />
                {alerta.valor !== null && (
                  <span className="text-sm font-bold">
                    Leitura atual: {formatarNumero(alerta.valor)} {alerta.unidade}
                  </span>
                )}
              </div>
            </div>
          </section>

          {alerta.serie ? (
            <section className="rounded-lg border border-line bg-card p-4">
              <h2 className="mb-2 font-bold">Últimos 30 minutos</h2>
              <GraficoSerie serie={alerta.serie} />
            </section>
          ) : (
            <section className="rounded-lg border border-line bg-card p-4 text-[15px]">
              O sensor parou de enviar leituras. Pode ser falta de energia no poste ou de rede. Se você mora perto, avise o
              que está acontecendo.
            </section>
          )}

          <section className="rounded-lg border border-line bg-card p-4 text-sm text-mut">
            Este alerta foi gerado automaticamente pelo sensor Vizi preso ao poste. Quem decide o estado é o próprio sensor.
            Aqui só mostramos o que ele informou.
          </section>

          <Botao variante="secundario" para="/avisar">
            Está acontecendo outra coisa aí? Avise
          </Botao>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <MapaBairro alertas={[alerta]} destacadoId={alerta.id} className="h-56" />
          <section className="rounded-lg border border-line bg-card p-4">
            <h2 className="mb-3 font-bold">Linha do tempo</h2>
            <LinhaDoTempo itens={alerta.linhaDoTempo} />
          </section>
        </div>
      </div>
    </>
  )
}
