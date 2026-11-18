import asyncio
from datetime import datetime, timezone

import httpx
import pytest

from tests.conftest import carregar
from vizi_api.config import Config
from vizi_api.fiware import Fiware, FiwareIndisponivel
from vizi_api.modelos import Saude

AGORA = datetime(2026, 11, 12, 20, 53, 10, tzinfo=timezone.utc)
CFG = Config()


def run(coro):
    return asyncio.run(coro)


def fiware_com(handler):
    cliente = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    return Fiware(CFG, cliente, agora=lambda: AGORA)


def handler_ok(sth_vazio=False):
    def h(req: httpx.Request):
        assert req.headers["fiware-service"] == "smart"
        if req.url.path == "/v2/entities":
            return httpx.Response(200, json=[carregar("entidade_003.json")])
        if "/STH/" in req.url.path:
            if sth_vazio:
                return httpx.Response(404, json={"error": "NotFound"})
            if req.url.path.endswith("/evento"):
                return httpx.Response(200, json=carregar("eventos_003.json"))
            return httpx.Response(200, json={"contextResponses": [{"contextElement": {"attributes": [
                {"name": "nivelAgua", "values": [{"recvTime": "2026-11-12T20:53:04.912Z", "attrValue": 25.3}]}]}}]})
        return httpx.Response(404)
    return h


def test_monta_alertas_com_desde():
    alertas = run(fiware_com(handler_ok()).alertas())
    assert [a.id for a in alertas] == ["vizi003-alagamento"]
    assert alertas[0].desde == datetime(2026, 11, 12, 20, 52, 34, 904000, tzinfo=timezone.utc)


def test_detalhe_traz_serie_e_linha():
    d = run(fiware_com(handler_ok()).alerta("vizi003-alagamento"))
    assert d.serie.pontos[0].v == 25.3 and d.linhaDoTempo[0].texto.startswith("Sensor detectou alagamento")


def test_orion_fora_vira_indisponivel_e_saude_false():
    def recusa(req):
        raise httpx.ConnectError("recusado", request=req)
    f = fiware_com(recusa)
    with pytest.raises(FiwareIndisponivel):
        run(f.sensores())
    assert run(f.saude()) == Saude(orion=False, sth=False)


def test_orion_500_vira_indisponivel():
    with pytest.raises(FiwareIndisponivel):
        run(fiware_com(lambda req: httpx.Response(500)).sensores())


def test_sth_sem_historico_retorna_vazio():
    f = fiware_com(handler_ok(sth_vazio=True))
    alertas = run(f.alertas())
    assert alertas[0].desde is None
    assert run(f.alerta("vizi003-alagamento")).serie.pontos == []


def test_alerta_inexistente_none():
    assert run(fiware_com(handler_ok()).alerta("vizi999-energia")) is None


def test_bairro():
    b = run(fiware_com(handler_ok()).bairro())
    assert b.sensores == 1 and b.alertasAtivos == 1
