# Vizi · Edge Computing & Computer Systems (GS 2026.2)

> Quando falta, o bairro avisa.

Sensor Vizi: um ESP32 preso ao poste que mede **energia** (tensão do poste), **sinal** (latência da rede) e **alagamento** (nível da água na rua). Ele decide o estado sozinho, avisa no local de forma discreta (LED, tela e bipe) e publica no FIWARE. Lá, a API e o dashboard transformam a leitura em alerta para o morador.

## Arquitetura em 3 camadas

```
1. Device IoT        2. Back-end FIWARE (Docker)                         3. Aplicação
ESP32 (Wokwi) ─MQTT→ HiveMQ ─ponte→ Mosquitto → IoT Agent → Orion → STH ──→ API Vizi (FastAPI)
sim_vizi.py ───────────────MQTT───→ Mosquitto ┘                              └→ dashboard
```

| Pasta | O quê |
|---|---|
| `firmware/` | `sketch.ino`, `diagram.json` e `libraries.txt` do Wokwi |
| `fiware/` | `docker-compose.yml`, `provision.py` e o simulador `sim_vizi.py` (sensores extras) |
| `app/backend/` | API FastAPI + dashboard de teste (`static/index.html`) |
| `app/frontend/` | App do morador (React + Vite, cópia do app de Front) lendo a API Vizi real, com atualização a cada 5 s |
| `docs/contrato-dados.md` | formato dos dados (base dos dados fictícios do app de Front) |

## Como rodar as 3 camadas

O FIWARE roda em Docker, a API em Python 3 e o simulador em Python. Os comandos partem da pasta `edge/`.

```bash
# 1. Back-end FIWARE
cd fiware
docker compose up -d
python3 provision.py                     # service group, 3 sensores e a subscription do STH
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python sim_vizi.py --rapido    # sensores vizi002 e vizi003 (deixe rodando)

# 2. Device: abrir o projeto no Wokwi e dar play (publica como vizi001)
#    Wokwi fora do ar? use: sim_vizi.py --rapido --com-wokwi

# 3. API + dashboard (outro terminal)
cd app/backend
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn vizi_api.main:app --port 8010
```

```bash
# 4. App do morador (outro terminal)
cd app/frontend
npm install
npm run dev                              # http://localhost:5173
```

O app do morador fica em http://localhost:5173 e lê a API em `http://localhost:8010` (mude com `VITE_API_VIZI_URL`). Sem FIWARE rodando, use `VITE_SENSORES_MOCK=true npm run dev` para ver os sensores simulados. O dashboard de teste continua em http://localhost:8010 e a documentação da API em http://localhost:8010/docs.

Testes da API: `cd app/backend && .venv/bin/pytest -q`

## Para a AWS (opcional)

Basta rodar o mesmo `docker compose up -d` e o `provision.py` numa EC2, e subir a API apontando para ela com `ORION_URL=http://<ip>:1026` e `STH_URL=http://<ip>:8666`. O Wokwi continua publicando no HiveMQ e a ponte do Mosquitto traz as mensagens, então não é preciso alterar o firmware.
