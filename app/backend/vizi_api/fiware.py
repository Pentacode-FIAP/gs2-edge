"""Busca os dados do Vizi no Orion (estado atual) e no STH-Comet (historico)."""

import asyncio
from datetime import datetime, timezone

import httpx

from . import alertas as al
from .config import Config
from .modelos import AlertaDetalhe, Alerta, Bairro, Evento, PontoSerie, Saude, Sensor
from .normalizar import eventos_do_sth, sensor_de_entidade, serie_do_sth

HEADERS = {"fiware-service": "smart", "fiware-servicepath": "/"}
TIPO = "SensorVizi"
LASTN_SERIE, LASTN_EVENTOS, LASTN_BAIRRO = 60, 20, 100


class FiwareIndisponivel(Exception):
    """Orion ou STH-Comet fora do ar."""


def agora_utc() -> datetime:
    return datetime.now(timezone.utc)


def _entidade(sensor_id: str) -> str:
    return f"urn:ngsi-ld:{TIPO}:{sensor_id.removeprefix('vizi')}"


class Fiware:
    def __init__(self, cfg: Config, cliente: httpx.AsyncClient, agora=agora_utc):
        self.cfg, self.cliente, self.agora = cfg, cliente, agora

    async def _get(self, url: str, params: dict | None = None):
        try:
            r = await self.cliente.get(url, params=params, headers=HEADERS, timeout=3)
        except httpx.HTTPError as e:
            raise FiwareIndisponivel(str(e)) from e
        if r.status_code >= 500:
            raise FiwareIndisponivel(f"{url}: {r.status_code}")
        return r

    async def _sth(self, sensor_id: str, attr: str, last_n: int) -> dict:
        url = f"{self.cfg.sth_url}/STH/v1/contextEntities/type/{TIPO}/id/{_entidade(sensor_id)}/attributes/{attr}"
        r = await self._get(url, {"lastN": last_n})
        return r.json() if r.status_code == 200 else {}   # 404 = ainda sem historico

    async def _eventos(self, sensor_id: str, last_n: int) -> list[Evento]:
        return eventos_do_sth(await self._sth(sensor_id, "evento", last_n))

    async def sensores(self) -> list[Sensor]:
        r = await self._get(f"{self.cfg.orion_url}/v2/entities", {"type": TIPO, "limit": 100})
        if r.status_code != 200:
            raise FiwareIndisponivel(f"Orion respondeu {r.status_code}")
        agora = self.agora()
        lista = [sensor_de_entidade(e, agora, self.cfg.limite_online_s) for e in r.json()]
        return sorted(lista, key=lambda s: s.id)

    async def _alertas_e_eventos(self, last_n: int):
        sensores = await self.sensores()
        eventos = await asyncio.gather(*(self._eventos(s.id, last_n) for s in sensores))
        por_sensor = {s.id: evs for s, evs in zip(sensores, eventos)}
        agora = self.agora()
        alertas = [a for s in sensores for a in al.alertas_do_sensor(s, por_sensor[s.id], agora)]
        return sensores, por_sensor, al.ordenar_alertas(alertas)

    async def alertas(self) -> list[Alerta]:
        return (await self._alertas_e_eventos(LASTN_EVENTOS))[2]

    async def alerta(self, alerta_id: str) -> AlertaDetalhe | None:
        _, por_sensor, alertas = await self._alertas_e_eventos(LASTN_EVENTOS)
        alerta = next((a for a in alertas if a.id == alerta_id), None)
        if alerta is None:
            return None
        pontos: list[PontoSerie] = []
        if alerta.tipo in al.MEDIDAS:
            pontos = serie_do_sth(await self._sth(alerta.sensorId, al.MEDIDAS[alerta.tipo][0], LASTN_SERIE))
        return al.detalhe(alerta, por_sensor[alerta.sensorId], pontos, self.agora())

    async def bairro(self) -> Bairro:
        sensores, por_sensor, alertas = await self._alertas_e_eventos(LASTN_BAIRRO)
        return al.bairro(sensores, por_sensor, alertas, self.agora())

    async def saude(self) -> Saude:
        async def responde(url):
            try:
                await self._get(url)
                return True
            except FiwareIndisponivel:
                return False
        orion, sth = await asyncio.gather(responde(f"{self.cfg.orion_url}/version"),
                                          responde(f"{self.cfg.sth_url}/version"))
        return Saude(orion=orion, sth=sth)
