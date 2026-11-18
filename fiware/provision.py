"""Provisiona o FIWARE local do Vizi.

Cria, em ordem:
  1. o service group do IoT Agent (apikey TEF, igual ao FIWARE Descomplicado)
  2. os sensores do bairro (vizi001 = Wokwi; vizi002 e vizi003 = simulador)
  3. a subscription do Orion para o STH-Comet guardar o historico

Pode rodar de novo sem problema: o que ja existe e ignorado (sensores sao atualizados).

Uso: python provision.py [host]   (padrao: localhost)
"""

import json
import sys
import urllib.error
import urllib.request

HOST = sys.argv[1] if len(sys.argv) > 1 else "localhost"
IOTA = f"http://{HOST}:4041"
ORION = f"http://{HOST}:1026"
HEADERS = {"Content-Type": "application/json", "fiware-service": "smart", "fiware-servicepath": "/"}

ENTITY_TYPE = "SensorVizi"

# Mapeamento UltraLight (objeto curto do payload) -> atributo no Orion.
# Este e o contrato de dados do Vizi: o mesmo nome vale para API e front.
ATRIBUTOS = [
    {"object_id": "e",  "name": "tensao",            "type": "Number"},
    {"object_id": "es", "name": "estadoEnergia",     "type": "Text"},
    {"object_id": "n",  "name": "latencia",          "type": "Number"},
    {"object_id": "ns", "name": "estadoSinal",       "type": "Text"},
    {"object_id": "a",  "name": "nivelAgua",         "type": "Number"},
    {"object_id": "as", "name": "estadoAgua",        "type": "Text"},
    {"object_id": "g",  "name": "estadoGeral",       "type": "Text"},
    {"object_id": "te", "name": "minutosSemEnergia", "type": "Number"},
    {"object_id": "tn", "name": "minutosSemSinal",   "type": "Number"},
    {"object_id": "q",  "name": "filaOffline",       "type": "Number"},
    {"object_id": "ev", "name": "evento",            "type": "Text"},
]

# Pontos fixos de instalacao (ficticios, Campo Limpo - SP, mesmo bairro do prototipo do app).
SENSORES = [
    {"id": "vizi001", "nome": "Poste 01 - Rua das Flores", "lat": -23.6480, "lng": -46.7590, "origem": "wokwi"},
    {"id": "vizi002", "nome": "Praça do Campo Limpo",      "lat": -23.6455, "lng": -46.7560, "origem": "simulador"},
    {"id": "vizi003", "nome": "Córrego Pirajuçara",        "lat": -23.6420, "lng": -46.7620, "origem": "simulador"},
]


def chamar(metodo, url, corpo=None):
    dados = json.dumps(corpo).encode() if corpo is not None else None
    # Orion recusa Content-Type em GET/DELETE (sem corpo)
    headers = HEADERS if dados is not None else {k: v for k, v in HEADERS.items() if k != "Content-Type"}
    req = urllib.request.Request(url, data=dados, method=metodo, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def ok(status, texto, rotulo):
    if status in (200, 201, 204):
        print(f"  [ok] {rotulo}")
    elif status == 409 or "DUPLICATE" in texto.upper():
        print(f"  [ja existe] {rotulo}")
    else:
        print(f"  [ERRO {status}] {rotulo}: {texto}")
        sys.exit(1)


def main():
    print(f"Provisionando FIWARE em {HOST}")

    print("1. Service group")
    st, tx = chamar("POST", f"{IOTA}/iot/services", {"services": [{
        "apikey": "TEF", "cbroker": "http://orion:1026", "entity_type": ENTITY_TYPE, "resource": "",
    }]})
    ok(st, tx, "apikey TEF")

    print("2. Sensores")
    for s in SENSORES:
        num = s["id"][-3:]
        fixos = [
            {"name": "nome", "type": "Text", "value": s["nome"]},
            {"name": "location", "type": "geo:json",
             "value": {"type": "Point", "coordinates": [s["lng"], s["lat"]]}},
            {"name": "origem", "type": "Text", "value": s["origem"]},
            {"name": "dadosSimulados", "type": "Boolean", "value": True},
        ]
        st, tx = chamar("POST", f"{IOTA}/iot/devices", {"devices": [{
            "device_id": s["id"],
            "entity_name": f"urn:ngsi-ld:{ENTITY_TYPE}:{num}",
            "entity_type": ENTITY_TYPE,
            "protocol": "PDI-IoTA-UltraLight",
            "transport": "MQTT",
            "attributes": ATRIBUTOS,
            "static_attributes": fixos,
        }]})
        if st == 409 or "DUPLICATE" in tx.upper():
            # ja existe: atualiza nome e local (chegam ao Orion na proxima medida)
            st, tx = chamar("PUT", f"{IOTA}/iot/devices/{s['id']}", {"static_attributes": fixos})
            ok(st, tx, f"{s['id']} ({s['nome']}) [atualizado]")
        else:
            ok(st, tx, f"{s['id']} ({s['nome']})")

    print("3. Subscription para o STH-Comet")
    st, tx = chamar("GET", f"{ORION}/v2/subscriptions?limit=100")
    ja_tem = st == 200 and any(sub.get("description") == "Vizi para STH-Comet" for sub in json.loads(tx))
    if ja_tem:
        print("  [ja existe] Vizi para STH-Comet")
    else:
        st, tx = chamar("POST", f"{ORION}/v2/subscriptions", {
            "description": "Vizi para STH-Comet",
            "subject": {"entities": [{"idPattern": ".*", "type": ENTITY_TYPE}]},
            "notification": {
                "http": {"url": "http://sth-comet:8666/notify"},
                "attrs": [a["name"] for a in ATRIBUTOS],
                "attrsFormat": "legacy",
            },
        })
        ok(st, tx, "Vizi para STH-Comet")

    print("Pronto.")


if __name__ == "__main__":
    main()
