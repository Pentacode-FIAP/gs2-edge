import L from 'leaflet'
import { useEffect } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router'
import { BAIRRO } from '../config'
import { linkDoAlerta } from '../domain/alertas'
import { infoTipo } from '../domain/tipos'
import Icone from './Icone'

// Pino do mapa: redondo para relato de morador, quadrado para sensor.
function criarPino(alerta, destacado) {
  const info = infoTipo(alerta.tipo)
  const tamanho = destacado ? 44 : 34
  const forma = alerta.fonte === 'sensor' ? 'border-radius:10px' : 'border-radius:999px'
  const icone = renderToStaticMarkup(<Icone nome={info.icone} className="size-[55%]" />)
  const html = `<span style="display:flex;align-items:center;justify-content:center;width:${tamanho}px;height:${tamanho}px;${forma};background:${info.cor};color:var(--card);border:3px solid var(--card);box-shadow:0 2px 6px rgba(0,0,0,.35)">${icone}</span>`
  return L.divIcon({ html, className: 'vizi-pin', iconSize: [tamanho, tamanho], iconAnchor: [tamanho / 2, tamanho / 2] })
}

// Centraliza no alerta destacado quando ele muda.
function SeguirDestaque({ alerta }) {
  const mapa = useMap()
  useEffect(() => {
    if (alerta) mapa.panTo([alerta.lat, alerta.lng], { animate: true })
  }, [alerta, mapa])
  return null
}

export default function MapaBairro({ alertas, destacadoId, aoDestacar, className = 'h-[60vh]' }) {
  const navegar = useNavigate()
  const destacado = alertas.find((a) => a.id === destacadoId)

  return (
    <div className={`relative isolate overflow-hidden rounded-lg border border-line ${className}`}>
      <MapContainer center={[BAIRRO.centro.lat, BAIRRO.centro.lng]} zoom={BAIRRO.zoom} scrollWheelZoom className="size-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {alertas.map((alerta) => (
          <Marker
            key={alerta.id}
            position={[alerta.lat, alerta.lng]}
            icon={criarPino(alerta, alerta.id === destacadoId)}
            zIndexOffset={alerta.id === destacadoId ? 1000 : 0}
            title={`${alerta.titulo} · ${alerta.local}`}
            eventHandlers={{
              click: () => (alerta.id === destacadoId ? navegar(linkDoAlerta(alerta)) : aoDestacar?.(alerta.id)),
            }}
          >
            <Tooltip direction="top" offset={[0, -18]}>
              {alerta.titulo} · {alerta.local}
            </Tooltip>
          </Marker>
        ))}
        <SeguirDestaque alerta={destacado} />
      </MapContainer>
    </div>
  )
}
