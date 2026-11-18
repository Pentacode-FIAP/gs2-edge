# Contrato de dados do Vizi

Este é o formato dos dados que o sensor Vizi gera, do ESP32 até a API. O app da entrega de Front e Web usa **esses mesmos campos** nos dados fictícios, para que eles pareçam ter saído do sensor.

```
ESP32 ──UltraLight/MQTT──> IoT Agent ──> Orion (estado atual) ──> STH-Comet (histórico)
                                              │                        │
                                              └──── API Vizi (FastAPI) ┘ ──> app / dashboard
```

**Regra principal:** quem decide o estado (normal, instável, falha) é o ESP32. A API e o app só mostram o estado. Nunca recalculam a partir de tensão, latência ou nível.

## 1. Do ESP32 para o FIWARE

O payload UltraLight vai no tópico `/TEF/<device_id>/attrs`.

| Objeto | Atributo no Orion | Tipo | Valores |
|---|---|---|---|
| `e` | `tensao` | Number | V (média móvel) |
| `es` | `estadoEnergia` | Text | `normal`, `instavel`, `sem_energia`, `erro_sensor` |
| `n` | `latencia` | Number | ms |
| `ns` | `estadoSinal` | Text | `ok`, `instavel`, `sem_sinal` |
| `a` | `nivelAgua` | Number | cm de água acima da rua |
| `as` | `estadoAgua` | Text | `normal`, `atencao`, `alagamento`, `erro_sensor` |
| `g` | `estadoGeral` | Text | `normal`, `atencao`, `critico` |
| `te` | `minutosSemEnergia` | Number | acumulado pelo sensor |
| `tn` | `minutosSemSinal` | Number | acumulado pelo sensor |
| `q` | `filaOffline` | Number | eventos esperando rede |
| `ev` | `evento` | Text | `servico,estado,valor,atraso_s` (relato automático) |

Os atributos fixos de cada sensor são `nome`, `location` (geo:json), `origem` e `dadosSimulados`, este sempre `true`.

## 2. Nomes no app

No app, "Água" é **falta d'água** e "Alagamento" é rua alagada. O sensor mede alagamento, por isso a API traduz:

| Orion | API e app |
|---|---|
| `tensao`, `estadoEnergia`, `minutosSemEnergia` | `energia.tensao`, `energia.estado`, `energia.minutosSem` |
| `latencia`, `estadoSinal`, `minutosSemSinal` | `sinal.latencia`, `sinal.estado`, `sinal.minutosSem` |
| `nivelAgua`, `estadoAgua`, evento `agua` | `alagamento.nivel`, `alagamento.estado`, tipo `alagamento` |

## 3. API (`http://localhost:8010`)

Os exemplos abaixo são respostas reais da API, com o simulador rodando.

### `GET /api/sensores`

```json
[
  {
    "id": "vizi001",
    "nome": "Poste 01 - Rua das Flores",
    "lat": -23.648,
    "lng": -46.759,
    "origem": "wokwi",
    "online": true,
    "aguardando": false,
    "ultimaLeitura": "2026-11-12T22:18:30.615000Z",
    "estadoGeral": "atencao",
    "energia": {
      "estado": "instavel",
      "tensao": 111.0,
      "minutosSem": 0
    },
    "sinal": {
      "estado": "ok",
      "latencia": 105.0,
      "minutosSem": 0
    },
    "alagamento": {
      "estado": "normal",
      "nivel": 1.3
    },
    "filaOffline": 0,
    "dadosSimulados": true
  }
]
```

- `online`: houve leitura nos últimos 30 s.
- `aguardando`: o sensor foi cadastrado, mas ainda não mandou nenhuma leitura.

### `GET /api/alertas`

```json
[
  {
    "id": "vizi003-alagamento",
    "tipo": "alagamento",
    "titulo": "Alagamento",
    "local": "Córrego Pirajuçara",
    "lat": -23.642,
    "lng": -46.762,
    "desde": "2026-11-12T22:18:16.671000Z",
    "gravidade": "alta",
    "status": "detectado",
    "fonte": "sensor",
    "sensorId": "vizi003",
    "valor": 25.0,
    "unidade": "cm"
  },
  {
    "id": "vizi001-energia",
    "tipo": "energia",
    "titulo": "Energia instável",
    "local": "Poste 01 - Rua das Flores",
    "lat": -23.648,
    "lng": -46.759,
    "desde": "2026-11-12T22:18:25.619000Z",
    "gravidade": "media",
    "status": "detectado",
    "fonte": "sensor",
    "sensorId": "vizi001",
    "valor": 111.0,
    "unidade": "V"
  }
]
```

- Gera um alerta para cada serviço fora do normal.
- `gravidade` é `alta` para `sem_energia`, `sem_sinal` e `alagamento`. Para os outros estados é `media`.
- Quando o sensor fica offline, aparece também o alerta `tipo: "sensor"` ("Sensor sem comunicação").
- Ordem: os de gravidade alta primeiro, depois os mais recentes.

### `GET /api/alertas/{id}`

```json
{
  "id": "vizi003-alagamento",
  "tipo": "alagamento",
  "titulo": "Alagamento",
  "local": "Córrego Pirajuçara",
  "lat": -23.642,
  "lng": -46.762,
  "desde": "2026-11-12T22:18:16.671000Z",
  "gravidade": "alta",
  "status": "detectado",
  "fonte": "sensor",
  "sensorId": "vizi003",
  "valor": 25.0,
  "unidade": "cm",
  "minutosSemServico": 0,
  "linhaDoTempo": [
    {
      "t": "2026-11-12T22:18:16.671000Z",
      "texto": "Sensor detectou alagamento (25,0 cm)"
    },
    {
      "t": "2026-11-12T20:52:34.904000Z",
      "texto": "Sensor detectou alagamento (24,8 cm)"
    }
  ],
  "serie": {
    "medida": "nivelAgua",
    "unidade": "cm",
    "pontos": [
      {
        "t": "2026-11-12T22:18:21.620000Z",
        "v": 25.4
      },
      {
        "t": "2026-11-12T22:18:26.611000Z",
        "v": 25.3
      },
      {
        "t": "2026-11-12T22:18:31.615000Z",
        "v": 25.0
      }
    ],
    "faixas": {
      "atencao": 8.0,
      "falha": 15.0
    }
  }
}
```

- `faixas` servem **só para desenhar** o gráfico. São os limites do firmware.
- Se o alerta não existir mais, a resposta é 404: o serviço voltou ao normal.

### `GET /api/bairro`

```json
{
  "nome": "Campo Limpo",
  "horasSemServico": 0.4,
  "porTipo": [
    {
      "tipo": "energia",
      "minutos": 0
    },
    {
      "tipo": "sinal",
      "minutos": 0
    },
    {
      "tipo": "alagamento",
      "minutos": 24
    }
  ],
  "alertasAtivos": 3,
  "sensores": 3,
  "sensoresOnline": 3
}
```

### Erros

- `503 {"detail": "Sem conexão com o FIWARE"}`: o Orion ou o STH está fora do ar.
- `GET /api/health`: `{"orion": bool, "sth": bool}`.

## 4. Para o app de Front e Web (dados fictícios)

- Sensores e alertas fictícios usam exatamente os campos acima.
- Um **relato de morador** usa os mesmos campos de `Alerta`, com estas diferenças:
  - `fonte: "morador"`;
  - `status: "aberto"` ou `"confirmado"`;
  - os campos extras `confirmacoes` e `negacoes`;
  - `sensorId: null`.
- Assim, a lista e o mapa juntam alerta de sensor e relato de morador sem tratamento especial.
- Tipos possíveis: `energia`, `sinal`, `alagamento`, `sensor` (vindos do sensor), `agua` e `transito` (só em relato de morador).
