import Botao from '../components/Botao'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { Carregando, Erro, Vazio } from '../components/Estados'
import Icone from '../components/Icone'
import SinalTipo from '../components/SinalTipo'
import { BAIRRO } from '../config'
import { minutosParaHoras } from '../domain/bairro'
import { formatarDataHora } from '../domain/tempo'
import { useResumoBairro } from '../hooks/useResumoBairro'
import { useToast } from '../hooks/useToast'

export default function Relatorio() {
  const { resumo, textoReclamacao, baixarCsv, carregando, erro, recarregar } = useResumoBairro()
  const mostrarToast = useToast()

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(textoReclamacao)
      mostrarToast('Texto copiado.')
    } catch {
      mostrarToast('Não deu para copiar. Selecione o texto e copie manualmente.', 'erro')
    }
  }

  if (carregando) return <Carregando texto="Montando o relatório…" />

  return (
    <div className="mx-auto max-w-3xl">
      <CabecalhoPagina titulo="Relatório do bairro" subtitulo={`${BAIRRO.nome} · últimos ${resumo.dias} dias`} />

      {erro && (
        <div className="mb-4">
          <Erro compacto erro={{ message: `Parte dos avisos não carregou. ${erro.message}` }} aoTentarDeNovo={recarregar} />
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-line bg-card p-4">
          <p className="text-3xl font-extrabold">{minutosParaHoras(resumo.minutosTotal).toLocaleString('pt-BR')} h</p>
          <p className="text-sm text-mut">sem serviço</p>
        </div>
        <div className="rounded-lg border border-line bg-card p-4">
          <p className="text-3xl font-extrabold">{resumo.totalAvisos}</p>
          <p className="text-sm text-mut">{resumo.totalAvisos === 1 ? 'aviso confirmado' : 'avisos confirmados'}</p>
        </div>
      </div>

      <section aria-labelledby="titulo-texto" className="rounded-lg border border-line bg-card p-4">
        <h2 id="titulo-texto" className="mb-2 font-bold">
          Texto pronto para reclamar
        </h2>
        <p className="border-l-4 border-pri bg-bg py-3 pr-3 pl-4 text-base leading-relaxed">{textoReclamacao}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Botao onClick={copiarTexto}>
            <Icone nome="copiar" className="size-4" />
            Copiar texto
          </Botao>
          <Botao variante="contorno" onClick={baixarCsv} disabled={resumo.avisos.length === 0}>
            <Icone nome="baixar" className="size-4" />
            Baixar CSV
          </Botao>
        </div>
        <p className="mt-2 text-sm text-mut">
          Use o texto na ouvidoria da distribuidora de energia, da Sabesp, da operadora ou da prefeitura (156).
        </p>
      </section>

      <section aria-labelledby="titulo-avisos" className="mt-4">
        <h2 id="titulo-avisos" className="mb-2 font-bold">
          Avisos que entram no relatório
        </h2>
        {resumo.avisos.length === 0 ? (
          <Vazio titulo="Nenhum aviso confirmado no período" />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-card">
            {resumo.avisos.map((aviso) => (
              <li key={aviso.id} className="flex items-center gap-3 px-4 py-3">
                <SinalTipo tipo={aviso.tipo} />
                <div className="min-w-0">
                  <p className="font-semibold">{aviso.titulo}</p>
                  <p className="text-sm text-mut">
                    {aviso.local} · desde {formatarDataHora(aviso.desde)}
                    {aviso.encerradoEm ? ` até ${formatarDataHora(aviso.encerradoEm)}` : ' · ainda acontecendo'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
