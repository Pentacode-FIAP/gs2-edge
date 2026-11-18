// Imitação da API Vizi (FastAPI do projeto de Edge) rodando no navegador.
// Monta as respostas de /api/sensores, /api/alertas e /api/alertas/{id} com as MESMAS regras
// de edge/app/backend/vizi_api/alertas.py. O estado de cada serviço já vem "decidido pelo sensor";
// aqui nada compara leitura com limite. As faixas servem só para desenhar o gráfico.
import { SENSORES_FAKE } from './dadosSensores'

const TITULOS = {
  'energia:instavel': 'Energia instável',
  'energia:sem_energia': 'Sem energia',
  'energia:erro_sensor': 'Sensor com defeito (energia)',
  'sinal:instavel': 'Sinal instável',
  'sinal:sem_sinal': 'Sem sinal',
  'alagamento:atencao': 'Água subindo na rua',
  'alagamento:alagamento': 'Alagamento',
  'alagamento:erro_sensor': 'Sensor com defeito (alagamento)',
}
const NORMAIS = { energia: 'normal', sinal: 'ok', alagamento: 'normal' }
const GRAVES = new Set(['sem_energia', 'sem_sinal', 'alagamento'])
const MEDIDAS = {
  energia: { medida: 'tensao', unidade: 'V', faixas: { atencao: 117, falha: 110 } },
  sinal: { medida: 'latencia', unidade: 'ms', faixas: { atencao: 300, falha: 1000 } },
  alagamento: { medida: 'nivelAgua', unidade: 'cm', faixas: { atencao: 8, falha: 15 } },
}
const ESTADO_LEGIVEL = {
  instavel: 'instabilidade',
  sem_energia: 'falta de energia',
  sem_sinal: 'falta de sinal',
  atencao: 'água subindo',
  alagamento: 'alagamento',
  erro_sensor: 'defeito no sensor',
}

const minutosAtras = (agora, min) => new Date(agora.getTime() - min * 60000).toISOString()

function estadoEValor(sensor, servico) {
  if (servico === 'energia') return [sensor.energia.estado, sensor.energia.tensao]
  if (servico === 'sinal') return [sensor.sinal.estado, sensor.sinal.latencia]
  return [sensor.alagamento.estado, sensor.alagamento.nivel]
}

// Sensor no formato público do contrato (sem os campos internos do mock).
function paraSensor(bruto, agora) {
  const { eventos: _eventos, ultimaLeituraMinAtras, ...resto } = bruto
  return { ...resto, ultimaLeitura: minutosAtras(agora, ultimaLeituraMinAtras), dadosSimulados: true }
}

function alertasDoSensor(bruto, agora) {
  if (bruto.aguardando) return []
  const alertas = []

  for (const [servico, normal] of Object.entries(NORMAIS)) {
    const [estado, valor] = estadoEValor(bruto, servico)
    if (!estado || estado === normal) continue
    // Como na API: "desde" é o evento mais recente com esse estado.
    const eventosIguais = bruto.eventos.filter((e) => e.servico === servico && e.estado === estado)
    const maisRecente = eventosIguais.length
      ? Math.min(...eventosIguais.map((e) => e.minAtras))
      : bruto.ultimaLeituraMinAtras
    alertas.push({
      id: `${bruto.id}-${servico}`,
      tipo: servico,
      titulo: TITULOS[`${servico}:${estado}`] ?? `${servico}: ${estado}`,
      local: bruto.nome,
      lat: bruto.lat,
      lng: bruto.lng,
      desde: minutosAtras(agora, maisRecente),
      gravidade: GRAVES.has(estado) ? 'alta' : 'media',
      status: 'detectado',
      fonte: 'sensor',
      sensorId: bruto.id,
      valor,
      unidade: MEDIDAS[servico].unidade,
    })
  }

  if (!bruto.online) {
    alertas.push({
      id: `${bruto.id}-sensor`,
      tipo: 'sensor',
      titulo: 'Sensor sem comunicação',
      local: bruto.nome,
      lat: bruto.lat,
      lng: bruto.lng,
      desde: minutosAtras(agora, bruto.ultimaLeituraMinAtras),
      gravidade: 'media',
      status: 'detectado',
      fonte: 'sensor',
      sensorId: bruto.id,
      valor: null,
      unidade: null,
    })
  }
  return alertas
}

function textoEvento(evento, unidade) {
  let texto
  if (evento.estado === NORMAIS[evento.servico]) {
    texto = 'Serviço normalizado'
  } else {
    const valor = evento.valor.toFixed(1).replace('.', ',')
    texto = `Sensor detectou ${ESTADO_LEGIVEL[evento.estado] ?? evento.estado} (${valor} ${unidade})`
  }
  if (evento.atrasoS > 0) texto += ` · enviado ${evento.atrasoS} s depois (sem rede)`
  return texto
}

// Série dos últimos 30 minutos: liga os valores dos eventos até a leitura atual (interpolação
// linear) e soma um "ruído" determinístico (seno), para o gráfico não mudar a cada recarga.
function gerarSerie(bruto, servico, agora) {
  const { medida, unidade, faixas } = MEDIDAS[servico]
  const [, valorAtual] = estadoEValor(bruto, servico)
  const ancoras = [
    ...bruto.eventos.filter((e) => e.servico === servico).map((e) => ({ min: e.minAtras, v: e.valor })),
    { min: 0, v: valorAtual },
  ].sort((a, b) => b.min - a.min)
  const amplitude = { energia: 0.8, sinal: 25, alagamento: 0.3 }[servico]
  const pontos = []

  for (let min = 30; min >= 0; min -= 1) {
    const depois = ancoras.find((a) => a.min <= min)
    const antes = [...ancoras].reverse().find((a) => a.min >= min) ?? depois
    const fracao = antes.min === depois.min ? 1 : (antes.min - min) / (antes.min - depois.min)
    const base = antes.v + (depois.v - antes.v) * fracao
    const v = min === 0 ? valorAtual : base + Math.sin(min * 1.7) * amplitude
    pontos.push({ t: minutosAtras(agora, min), v: Math.round(Math.max(0, v) * 10) / 10 })
  }
  return { medida, unidade, pontos, faixas }
}

function ordenar(alertas) {
  return [...alertas].sort((a, b) => {
    if (a.gravidade !== b.gravidade) return a.gravidade === 'alta' ? -1 : 1
    return new Date(b.desde) - new Date(a.desde)
  })
}

// ----- "Endpoints" -----

export function getSensores(agora = new Date()) {
  return SENSORES_FAKE.map((s) => paraSensor(s, agora))
}

export function getAlertas(agora = new Date()) {
  return ordenar(SENSORES_FAKE.flatMap((s) => alertasDoSensor(s, agora)))
}

export function getAlerta(id, agora = new Date()) {
  const alerta = getAlertas(agora).find((a) => a.id === id)
  if (!alerta) return null
  const bruto = SENSORES_FAKE.find((s) => s.id === alerta.sensorId)
  const minutosSemServico = Math.floor((agora - new Date(alerta.desde)) / 60000)

  if (!MEDIDAS[alerta.tipo]) {
    return { ...alerta, minutosSemServico, linhaDoTempo: [], serie: null }
  }

  const { unidade } = MEDIDAS[alerta.tipo]
  const linhaDoTempo = bruto.eventos
    .filter((e) => e.servico === alerta.tipo)
    .sort((a, b) => a.minAtras - b.minAtras)
    .slice(0, 20)
    .map((e) => ({ t: minutosAtras(agora, e.minAtras), texto: textoEvento(e, unidade) }))

  return { ...alerta, minutosSemServico, linhaDoTempo, serie: gerarSerie(bruto, alerta.tipo, agora) }
}
