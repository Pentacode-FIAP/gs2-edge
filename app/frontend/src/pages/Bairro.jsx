import BarraHoras from '../components/BarraHoras'
import Botao from '../components/Botao'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { Carregando, Erro } from '../components/Estados'
import Icone from '../components/Icone'
import { BAIRRO } from '../config'
import { minutosParaHoras } from '../domain/bairro'
import { infoTipo } from '../domain/tipos'
import { formatarDuracao } from '../domain/tempo'
import { useResumoBairro } from '../hooks/useResumoBairro'

function formatarDia(dataIso) {
  const [ano, mes, dia] = dataIso.split('-').map(Number)
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
}

export default function Bairro() {
  const { resumo, carregando, erro, recarregar } = useResumoBairro()

  if (carregando) return <Carregando texto="Somando as horas do bairro…" />

  const maximo = Math.max(0, ...resumo.porTipo.map((t) => t.minutos ?? 0))
  const horas = minutosParaHoras(resumo.minutosTotal)

  return (
    <div className="mx-auto max-w-3xl">
      <CabecalhoPagina titulo={BAIRRO.nome} subtitulo={`Resumo dos últimos ${resumo.dias} dias`} />

      {erro && (
        <div className="mb-4">
          <Erro compacto erro={{ message: `Parte dos avisos não carregou. ${erro.message}` }} aoTentarDeNovo={recarregar} />
        </div>
      )}

      <section className="border-b border-line pb-5">
        <p className="text-mut">Horas sem serviço no bairro</p>
        <p className="text-6xl font-extrabold tracking-tight tabular-nums">
          {horas.toLocaleString('pt-BR')}
          <span className="ml-1 text-3xl text-mut">h</span>
        </p>
        <p className="mt-1 text-mut">
          {resumo.tiposComRegistro} {resumo.tiposComRegistro === 1 ? 'tipo de problema' : 'tipos de problema'} ·{' '}
          {resumo.totalAvisos} {resumo.totalAvisos === 1 ? 'aviso confirmado' : 'avisos confirmados'}
        </p>
      </section>

      <section aria-labelledby="titulo-tipos" className="mt-5 rounded-lg border border-line bg-card p-4">
        <h2 id="titulo-tipos" className="mb-3 font-bold">
          Tempo sem cada serviço
        </h2>
        <ul className="flex flex-col gap-3">
          {resumo.porTipo.map((item) => (
            <BarraHoras key={item.tipo} item={item} maximo={maximo} />
          ))}
        </ul>
        <p className="mt-3 text-xs text-mut">
          Contam avisos confirmados por vizinhos e alertas dos sensores. Trânsito conta só a quantidade de avisos.
        </p>
      </section>

      {resumo.piorDia && (
        <section className="mt-4 flex items-center gap-3 rounded-lg border border-line bg-card p-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warnbg text-warn">
            <Icone nome="alerta" />
          </span>
          <div>
            <p className="text-sm text-mut">Pior dia do período</p>
            <p className="font-bold">
              {formatarDia(resumo.piorDia.data)}
            </p>
            <p className="text-sm text-mut">
              {formatarDuracao(resumo.piorDia.minutos)} sem serviço, somando{' '}
              {resumo.piorDia.tipos.map((t) => infoTipo(t).rotulo.toLowerCase()).join(', ')}
            </p>
          </div>
        </section>
      )}

      <Botao para="/relatorio" variante="secundario" className="mt-4 w-full">
        <Icone nome="documento" className="size-4" />
        Gerar relatório para reclamar
      </Botao>
    </div>
  )
}
