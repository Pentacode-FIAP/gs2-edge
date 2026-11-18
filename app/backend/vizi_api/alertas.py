"""Monta alertas, detalhe e resumo do bairro a partir do que o sensor publicou.

Nada aqui compara leitura com limite: o estado de cada servico ja chega
decidido pelo ESP32. As faixas em MEDIDAS servem so para o grafico.
"""

from datetime import datetime

from .modelos import (Alerta, AlertaDetalhe, Bairro, Evento, ItemLinhaDoTempo, MinutosTipo,
                      PontoSerie, Sensor, Serie)

TITULOS = {
    ("energia", "instavel"): "Energia instável",
    ("energia", "sem_energia"): "Sem energia",
    ("energia", "erro_sensor"): "Sensor com defeito (energia)",
    ("sinal", "instavel"): "Sinal instável",
    ("sinal", "sem_sinal"): "Sem sinal",
    ("alagamento", "atencao"): "Água subindo na rua",
    ("alagamento", "alagamento"): "Alagamento",
    ("alagamento", "erro_sensor"): "Sensor com defeito (alagamento)",
}
NORMAIS = {"energia": "normal", "sinal": "ok", "alagamento": "normal"}
GRAVES = {"sem_energia", "sem_sinal", "alagamento"}

# servico -> (atributo no Orion/STH, unidade, faixas para desenhar)
MEDIDAS = {
    "energia": ("tensao", "V", {"atencao": 117, "falha": 110}),
    "sinal": ("latencia", "ms", {"atencao": 300, "falha": 1000}),
    "alagamento": ("nivelAgua", "cm", {"atencao": 8, "falha": 15}),
}
ESTADO_LEGIVEL = {
    "instavel": "instabilidade",
    "sem_energia": "falta de energia",
    "sem_sinal": "falta de sinal",
    "atencao": "água subindo",
    "alagamento": "alagamento",
    "erro_sensor": "defeito no sensor",
}


def _estado_e_valor(s: Sensor, servico: str):
    if servico == "energia":
        return s.energia.estado, s.energia.tensao
    if servico == "sinal":
        return s.sinal.estado, s.sinal.latencia
    return s.alagamento.estado, s.alagamento.nivel


def alertas_do_sensor(s: Sensor, eventos: list[Evento], agora: datetime) -> list[Alerta]:
    if s.aguardando:
        return []
    alertas = []
    for servico, normal in NORMAIS.items():
        estado, valor = _estado_e_valor(s, servico)
        if estado is None or estado == normal:
            continue
        desde = max((e.t for e in eventos if e.servico == servico and e.estado == estado), default=None)
        alertas.append(Alerta(
            id=f"{s.id}-{servico}", tipo=servico,
            titulo=TITULOS.get((servico, estado), f"{servico}: {estado}"),
            local=s.nome, lat=s.lat, lng=s.lng, desde=desde,
            gravidade="alta" if estado in GRAVES else "media",
            sensorId=s.id, valor=valor, unidade=MEDIDAS[servico][1],
        ))
    if not s.online:
        alertas.append(Alerta(
            id=f"{s.id}-sensor", tipo="sensor", titulo="Sensor sem comunicação",
            local=s.nome, lat=s.lat, lng=s.lng, desde=s.ultimaLeitura,
            gravidade="media", sensorId=s.id,
        ))
    return alertas


def ordenar_alertas(alertas: list[Alerta]) -> list[Alerta]:
    def chave(a: Alerta):
        ts = a.desde.timestamp() if a.desde else float("-inf")
        return (0 if a.gravidade == "alta" else 1, a.desde is None, -ts)
    return sorted(alertas, key=chave)


def _texto_evento(e: Evento, unidade: str) -> str:
    if e.estado == NORMAIS.get(e.servico):
        texto = "Serviço normalizado"
    else:
        valor = f"{e.valor:.1f}".replace(".", ",")
        texto = f"Sensor detectou {ESTADO_LEGIVEL.get(e.estado, e.estado)} ({valor} {unidade})"
    if e.atrasoS > 0:
        texto += f" · enviado {e.atrasoS} s depois (sem rede)"
    return texto


def detalhe(alerta: Alerta, eventos: list[Evento], pontos: list[PontoSerie], agora: datetime) -> AlertaDetalhe:
    minutos = int((agora - alerta.desde).total_seconds() // 60) if alerta.desde else None
    serie = None
    linha = []
    if alerta.tipo in MEDIDAS:
        medida, unidade, faixas = MEDIDAS[alerta.tipo]
        serie = Serie(medida=medida, unidade=unidade, pontos=pontos, faixas=faixas)
        do_servico = [e for e in eventos if e.servico == alerta.tipo]
        linha = [ItemLinhaDoTempo(t=e.t, texto=_texto_evento(e, unidade))
                 for e in sorted(do_servico, key=lambda e: e.t, reverse=True)[:20]]
    return AlertaDetalhe(**alerta.model_dump(), minutosSemServico=minutos, linhaDoTempo=linha, serie=serie)


def _minutos_alagado(eventos: list[Evento], agora: datetime) -> float:
    total, inicio = 0.0, None
    for e in sorted((e for e in eventos if e.servico == "alagamento"), key=lambda e: e.t):
        if e.estado == "alagamento":
            # entrar de novo sem ter saido = sensor reiniciou; o intervalo anterior
            # nao tem fim conhecido e e descartado
            inicio = e.t
        elif e.estado != "alagamento" and inicio is not None:
            total += (e.t - inicio).total_seconds() / 60
            inicio = None
    if inicio is not None:
        total += (agora - inicio).total_seconds() / 60
    return total


def bairro(sensores: list[Sensor], eventos_por_sensor: dict[str, list[Evento]],
           alertas: list[Alerta], agora: datetime) -> Bairro:
    energia = sum(s.energia.minutosSem or 0 for s in sensores)
    sinal = sum(s.sinal.minutosSem or 0 for s in sensores)
    alagamento = int(sum(_minutos_alagado(evs, agora) for evs in eventos_por_sensor.values()))
    return Bairro(
        nome="Campo Limpo",
        horasSemServico=round((energia + sinal + alagamento) / 60, 1),
        porTipo=[MinutosTipo(tipo="energia", minutos=energia), MinutosTipo(tipo="sinal", minutos=sinal),
                 MinutosTipo(tipo="alagamento", minutos=alagamento)],
        alertasAtivos=len(alertas),
        sensores=len(sensores),
        sensoresOnline=sum(1 for s in sensores if s.online),
    )
