// Popula o recurso "relatos" do MockAPI com avisos FICTÍCIOS de moradores do Campo Limpo.
// Uso: npm run popular            (adiciona os exemplos)
//      npm run popular -- --limpar (apaga todos os relatos antes)
// Nenhum dado é real: nomes de rua são do bairro, mas os avisos são inventados.

const API = process.env.VITE_API_URL ?? 'https://6afa2d6b730c1d152f3209b1.mockapi.io/api/v1'
const URL_RELATOS = `${API}/relatos`
const agora = Date.now()
const horasAtras = (h) => new Date(agora - h * 3600 * 1000).toISOString()

const TITULOS = {
  energia: 'Sem energia',
  sinal: 'Sem sinal de celular',
  agua: 'Falta d’água',
  alagamento: 'Alagamento',
  transito: 'Trânsito parado',
}

// [tipo, gravidade, local, lat, lng, começou (h atrás), terminou (h atrás) | null, confirmações, negações, descrição]
const EXEMPLOS = [
  ['energia', 'alta', 'Rua Campo Limpo, perto do mercado', -23.6478, -46.7633, 2.2, null, 2, 0, 'Caiu tudo depois do barulho no poste da esquina.'],
  ['agua', 'media', 'Rua Dr. Luiz da Fonseca Galvão', -23.6441, -46.7598, 7, null, 3, 1, 'Sem água desde cedo, a caixa já secou.'],
  ['transito', 'media', 'Estrada do Campo Limpo, altura do terminal', -23.6496, -46.7652, 0.6, null, 0, 0, 'Ônibus parados, um carro quebrado na faixa.'],
  ['sinal', 'baixa', 'Praça perto da escola estadual', -23.6455, -46.7581, 1.1, null, 1, 0, ''],
  ['agua', 'alta', 'Rua Ana Aslan', -23.6503, -46.7605, 96, 90, 4, 3, 'Ficamos o dia inteiro sem água.'],
  ['energia', 'alta', 'Av. Carlos Lacerda', -23.6522, -46.7671, 240, 237, 3, 3, 'Apagão na avenida durante a chuva.'],
  ['alagamento', 'alta', 'Rua das Flores, perto do córrego', -23.6431, -46.7622, 312, 308, 5, 3, 'Água na altura da canela, carro não passava.'],
  ['agua', 'media', 'Rua Campo Limpo', -23.6472, -46.7641, 312, 310, 2, 3, ''],
]

function montar([tipo, gravidade, local, lat, lng, inicioH, fimH, confirmacoes, negacoes, descricao]) {
  const desde = horasAtras(inicioH)
  const encerradoEm = fimH === null ? null : horasAtras(fimH)
  const status = encerradoEm ? 'resolvido' : confirmacoes >= 2 ? 'confirmado' : 'aberto'
  const linhaDoTempo = [{ t: desde, texto: 'Aviso feito por morador' }]
  if (confirmacoes >= 2) linhaDoTempo.push({ t: horasAtras(inicioH - 0.2), texto: 'Confirmado por vizinhos' })
  if (encerradoEm) linhaDoTempo.push({ t: encerradoEm, texto: 'Encerrado: vizinhos avisaram que o serviço voltou' })

  return {
    tipo,
    titulo: TITULOS[tipo],
    local,
    lat,
    lng,
    desde,
    gravidade,
    status,
    fonte: 'morador',
    sensorId: null,
    valor: null,
    unidade: null,
    descricao,
    confirmacoes,
    negacoes,
    autorId: 'exemplo',
    encerradoEm,
    linhaDoTempo,
  }
}

async function requisitar(url, opcoes = {}) {
  const resposta = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opcoes })
  if (resposta.status === 404 && (!opcoes.method || opcoes.method === 'GET')) return []
  if (!resposta.ok) throw new Error(`${opcoes.method ?? 'GET'} ${url} -> HTTP ${resposta.status}`)
  return resposta.json()
}

if (process.argv.includes('--limpar')) {
  const atuais = await requisitar(URL_RELATOS)
  for (const r of atuais) await requisitar(`${URL_RELATOS}/${r.id}`, { method: 'DELETE' })
  console.log(`Apagados ${atuais.length} relatos.`)
}

for (const exemplo of EXEMPLOS) {
  const criado = await requisitar(URL_RELATOS, { method: 'POST', body: JSON.stringify(montar(exemplo)) })
  console.log(`+ ${criado.id} ${criado.titulo} · ${criado.local}`)
}
console.log('Pronto.')
