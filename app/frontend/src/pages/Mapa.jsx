import { useState } from 'react'
import AlertaCard from '../components/AlertaCard'
import Botao from '../components/Botao'
import { Carregando, Erro, Vazio } from '../components/Estados'
import FiltroTipos from '../components/FiltroTipos'
import Icone from '../components/Icone'
import MapaBairro from '../components/MapaBairro'
import { BAIRRO } from '../config'
import { useAlertas } from '../hooks/useAlertas'

export default function Mapa() {
  const { alertas, total, contagem, tipo, setTipo, busca, setBusca, carregando, erroSensores, erroRelatos, recarregar } =
    useAlertas()
  const [destacadoId, setDestacadoId] = useState(null)

  // Sem escolha do usuário, destaca o primeiro da lista (o mais grave e recente).
  const idEmDestaque = alertas.some((a) => a.id === destacadoId) ? destacadoId : alertas[0]?.id

  return (
    <>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{BAIRRO.nome}</h1>
          <p className="text-mut">
            {carregando
              ? 'Buscando avisos…'
              : `${total} ${total === 1 ? 'problema acontecendo' : 'problemas acontecendo'} agora · ${BAIRRO.cidade}`}
          </p>
        </div>
        <div className="hidden shrink-0 md:block">
          <Botao para="/avisar">
            <Icone nome="mais" className="size-5" />
            Avisar um problema
          </Botao>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="flex min-h-12 items-center gap-2 rounded-lg border border-line bg-card px-3 focus-within:border-pri focus-within:ring-2 focus-within:ring-pri/20">
          <Icone nome="busca" className="size-5 shrink-0 text-mut" />
          <span className="sr-only">Buscar rua ou tipo de problema</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar rua ou problema"
            className="h-11 w-full min-w-0 bg-transparent text-base outline-none placeholder:text-mut"
          />
        </label>

        <FiltroTipos selecionado={tipo} aoSelecionar={setTipo} contagem={contagem} total={total} />

        {erroRelatos && (
          <Erro compacto erro={{ message: `Os avisos de moradores não carregaram. ${erroRelatos.message}` }} aoTentarDeNovo={recarregar} />
        )}
        {erroSensores && <Erro compacto erro={erroSensores} aoTentarDeNovo={recarregar} />}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0">
          <MapaBairro
            alertas={alertas}
            destacadoId={idEmDestaque}
            aoDestacar={setDestacadoId}
            className="h-[42vh] min-h-64 md:h-[min(70vh,640px)]"
          />
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-mut">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-full border-2 border-mut" aria-hidden="true" /> Aviso de morador
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] border-2 border-mut" aria-hidden="true" /> Sensor no poste
            </span>
          </p>
        </div>

        <section aria-labelledby="titulo-lista" className="min-w-0">
          <h2 id="titulo-lista" className="mb-2 font-bold">
            Avisos no bairro
          </h2>
          {carregando && alertas.length === 0 ? (
            <Carregando texto="Buscando avisos…" />
          ) : alertas.length === 0 ? (
            <Vazio titulo="Nenhum aviso por aqui">
              {busca || tipo !== 'todos' ? 'Tente outro filtro ou outra busca.' : 'Tudo funcionando no bairro agora.'}
            </Vazio>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-card md:max-h-[min(70vh,640px)] md:overflow-y-auto">
              {alertas.map((alerta) => (
                <li key={alerta.id}>
                  <AlertaCard
                    alerta={alerta}
                    destacado={alerta.id === idEmDestaque}
                    aoPassarMouse={() => setDestacadoId(alerta.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
