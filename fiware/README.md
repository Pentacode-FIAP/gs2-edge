# FIWARE local do Vizi

Camada de back-end do sensor Vizi: recebe as leituras do ESP32 (Wokwi) por MQTT e guarda o estado atual (Orion) e o histórico (STH-Comet).

```
ESP32 (Wokwi) ──MQTT──> broker.hivemq.com ──ponte──> Mosquitto local ──> IoT Agent UL ──> Orion ──> STH-Comet
sim_vizi.py ───────────────────────────────MQTT──────> Mosquitto local ──┘
```

## Subir

```bash
docker compose up -d
python3 provision.py          # service group, 3 sensores e subscription do STH
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python sim_vizi.py  # vizi002 e vizi003 simulados (--rapido para mais incidentes)
```

Com o Wokwi fora do ar, `--com-wokwi` simula também o `vizi001`.

## Sensores

| device_id | Entidade no Orion | Local (fictício) | Quem publica |
|---|---|---|---|
| vizi001 | `urn:ngsi-ld:SensorVizi:001` | Poste 01 - Rua das Flores | ESP32 no Wokwi |
| vizi002 | `urn:ngsi-ld:SensorVizi:002` | Praça do Campo Limpo | simulador |
| vizi003 | `urn:ngsi-ld:SensorVizi:003` | Córrego Pirajuçara | simulador |

Headers de todas as chamadas: `fiware-service: smart` e `fiware-servicepath: /`.

## Contrato de dados

Payload UltraLight em `/TEF/<device_id>/attrs`:

| Objeto | Atributo no Orion | Tipo | Valores |
|---|---|---|---|
| `e` | `tensao` | Number | V (média móvel) |
| `es` | `estadoEnergia` | Text | `normal`, `instavel`, `sem_energia`, `erro_sensor` |
| `n` | `latencia` | Number | ms |
| `ns` | `estadoSinal` | Text | `ok`, `instavel`, `sem_sinal` |
| `a` | `nivelAgua` | Number | cm acima da rua |
| `as` | `estadoAgua` | Text | `normal`, `atencao`, `alagamento`, `erro_sensor` |
| `g` | `estadoGeral` | Text | `normal`, `atencao`, `critico` |
| `te` | `minutosSemEnergia` | Number | acumulado |
| `tn` | `minutosSemSinal` | Number | acumulado |
| `q` | `filaOffline` | Number | eventos esperando rede |
| `ev` | `evento` | Text | `servico,estado,valor,atraso_s` (relato automático) |

Atributos fixos: `nome`, `location` (geo:json), `origem`, `dadosSimulados` (sempre `true`, RN05).

## Consultas úteis

```bash
H='-H fiware-service:smart -H fiware-servicepath:/'
curl -s $H 'localhost:1026/v2/entities?type=SensorVizi&options=keyValues'
curl -s $H 'localhost:8666/STH/v1/contextEntities/type/SensorVizi/id/urn:ngsi-ld:SensorVizi:003/attributes/nivelAgua?lastN=20'
curl -s $H 'localhost:8666/STH/v1/contextEntities/type/SensorVizi/id/urn:ngsi-ld:SensorVizi:003/attributes/evento?lastN=20'
```

## AWS (depois)

Mesmo `docker-compose.yml` na EC2, liberar 1883, 1026, 4041 e 8666. No `sketch.ino`, trocar `BROKER_MQTT` pelo IP da EC2. A ponte com o HiveMQ deixa de ser necessária.
