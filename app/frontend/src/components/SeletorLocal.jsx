import L from 'leaflet'
import { useEffect, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { BAIRRO } from '../config'
import Icone from './Icone'

const PINO = L.divIcon({
  html: `<span style="display:block;color:var(--pri);filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))">${renderToStaticMarkup(
    <Icone nome="local" className="size-10" />,
  )}</span>`,
  className: 'vizi-pin',
  iconSize: [40, 40],
  iconAnchor: [20, 38],
})

// Toque no mapa move o pino.
function CliqueNoMapa({ aoMarcar }) {
  useMapEvents({ click: (e) => aoMarcar(e.latlng.lat, e.latlng.lng) })
  return null
}

function Centralizar({ posicao }) {
  const mapa = useMap()
  useEffect(() => {
    if (posicao) mapa.panTo([posicao.lat, posicao.lng])
  }, [posicao, mapa])
  return null
}

// "Onde?": referência em texto + ponto no mapa (toque no mapa ou "usar minha localização").
export default function SeletorLocal({ local, posicao, aoMudarLocal, aoMudarPosicao, erros = {} }) {
  const [buscandoGps, setBuscandoGps] = useState(false)
  const [avisoGps, setAvisoGps] = useState('')

  function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setAvisoGps('Este aparelho não informa a localização. Toque no mapa para marcar.')
      return
    }
    setBuscandoGps(true)
    setAvisoGps('')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        aoMudarPosicao(p.coords.latitude, p.coords.longitude)
        setBuscandoGps(false)
      },
      () => {
        setAvisoGps('Não conseguimos sua localização. Toque no mapa para marcar o lugar.')
        setBuscandoGps(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">Onde?</legend>

      <label htmlFor="local" className="mb-1 block text-sm text-mut">
        Rua ou ponto de referência
      </label>
      <input
        id="local"
        value={local}
        onChange={(e) => aoMudarLocal(e.target.value)}
        placeholder="Ex.: Rua das Flores, perto da padaria"
        maxLength={80}
        aria-invalid={Boolean(erros.local)}
        className="min-h-12 w-full rounded-lg border border-line bg-card px-3 text-base outline-none placeholder:text-mut focus:border-pri"
      />
      {erros.local && <p className="mt-1 text-sm font-semibold text-bad">{erros.local}</p>}

      <div className="mt-2 h-56 overflow-hidden rounded-lg border border-line md:h-64">
        <MapContainer center={[BAIRRO.centro.lat, BAIRRO.centro.lng]} zoom={BAIRRO.zoom} className="size-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CliqueNoMapa aoMarcar={aoMudarPosicao} />
          {posicao && <Marker position={[posicao.lat, posicao.lng]} icon={PINO} />}
          <Centralizar posicao={posicao} />
        </MapContainer>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-mut">{posicao ? 'Lugar marcado. Toque no mapa para ajustar.' : 'Toque no mapa para marcar o lugar.'}</p>
        <button
          type="button"
          onClick={usarMinhaLocalizacao}
          disabled={buscandoGps}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-bold text-pri disabled:opacity-60"
        >
          <Icone nome="local" className="size-4" />
          {buscandoGps ? 'Buscando…' : 'Usar minha localização'}
        </button>
      </div>
      {avisoGps && <p className="text-sm text-warn">{avisoGps}</p>}
      {erros.posicao && <p className="text-sm font-semibold text-bad">{erros.posicao}</p>}
    </fieldset>
  )
}
