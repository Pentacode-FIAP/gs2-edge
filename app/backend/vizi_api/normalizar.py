"""Traduz o que vem do Orion e do STH-Comet para o contrato da API.

O sensor chama o alagamento de "agua" (nivelAgua, estadoAgua, evento agua).
No app "Agua" e falta d'agua, entao aqui tudo vira "alagamento".
"""

from datetime import datetime, timedelta, timezone

from .modelos import Alagamento, Energia, Evento, PontoSerie, Sensor, Sinal

SERVICO_APP = {"agua": "alagamento", "energia": "energia", "sinal": "sinal"}


def data(texto: str) -> datetime:
    """Converte '2026-11-12T20:53:04.912Z' em datetime UTC."""
    d = datetime.fromisoformat(texto.replace("Z", "+00:00"))
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _valor(ent: dict, attr: str):
    a = ent.get(attr)
    return a.get("value") if isinstance(a, dict) else None


def _int(v):
    return int(v) if isinstance(v, (int, float)) else None


def _num(v):
    return float(v) if isinstance(v, (int, float)) else None


def sensor_de_entidade(ent: dict, agora: datetime, limite_s: int = 30) -> Sensor:
    instante = _valor(ent, "TimeInstant")
    ultima = data(instante) if instante else None
    coords = (_valor(ent, "location") or {}).get("coordinates") or [None, None]
    return Sensor(
        id="vizi" + ent["id"].rsplit(":", 1)[-1],
        nome=_valor(ent, "nome"),
        lat=coords[1],
        lng=coords[0],
        origem=_valor(ent, "origem"),
        online=ultima is not None and (agora - ultima).total_seconds() <= limite_s,
        aguardando=ultima is None,
        ultimaLeitura=ultima,
        estadoGeral=_valor(ent, "estadoGeral"),
        energia=Energia(estado=_valor(ent, "estadoEnergia"), tensao=_num(_valor(ent, "tensao")),
                        minutosSem=_int(_valor(ent, "minutosSemEnergia"))),
        sinal=Sinal(estado=_valor(ent, "estadoSinal"), latencia=_num(_valor(ent, "latencia")),
                    minutosSem=_int(_valor(ent, "minutosSemSinal"))),
        alagamento=Alagamento(estado=_valor(ent, "estadoAgua"), nivel=_num(_valor(ent, "nivelAgua"))),
        filaOffline=_int(_valor(ent, "filaOffline")),
        dadosSimulados=_valor(ent, "dadosSimulados") is not False,
    )


def parse_evento(texto, recebido: datetime) -> Evento | None:
    """'servico,estado,valor,atraso_s' -> Evento. Formato invalido -> None."""
    if not isinstance(texto, str):
        return None
    partes = texto.split(",")
    if len(partes) != 4 or partes[0] not in SERVICO_APP:
        return None
    try:
        valor = float(partes[2])
        atraso = int(partes[3])
    except ValueError:
        return None
    if atraso < 0:
        return None
    return Evento(t=recebido - timedelta(seconds=atraso), servico=SERVICO_APP[partes[0]],
                  estado=partes[1], valor=valor, atrasoS=atraso)


def _valores_sth(resposta: dict) -> list[dict]:
    try:
        return resposta["contextResponses"][0]["contextElement"]["attributes"][0]["values"] or []
    except (KeyError, IndexError, TypeError):
        return []


def eventos_do_sth(resposta: dict) -> list[Evento]:
    eventos = [parse_evento(v.get("attrValue"), data(v["recvTime"]))
               for v in _valores_sth(resposta) if v.get("recvTime")]
    return sorted((e for e in eventos if e), key=lambda e: e.t)


def serie_do_sth(resposta: dict) -> list[PontoSerie]:
    pontos = []
    for v in _valores_sth(resposta):
        try:
            pontos.append(PontoSerie(t=data(v["recvTime"]), v=float(v["attrValue"])))
        except (KeyError, TypeError, ValueError):
            continue
    return pontos
