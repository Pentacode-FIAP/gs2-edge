import httpx
import pytest
from fastapi.testclient import TestClient

from tests.test_fiware import AGORA, CFG, handler_ok
from vizi_api.fiware import Fiware
from vizi_api.main import app, get_fiware


def cliente_com(handler):
    fw = Fiware(CFG, httpx.AsyncClient(transport=httpx.MockTransport(handler)), agora=lambda: AGORA)
    app.dependency_overrides[get_fiware] = lambda: fw
    return TestClient(app)


@pytest.fixture(autouse=True)
def limpar():
    yield
    app.dependency_overrides.clear()


def test_rotas_ok():
    c = cliente_com(handler_ok())
    assert set(c.get("/api/health").json()) == {"orion", "sth"}
    assert c.get("/api/sensores").json()[0]["alagamento"]["estado"] == "alagamento"
    al = c.get("/api/alertas").json()
    assert al[0]["id"] == "vizi003-alagamento" and al[0]["gravidade"] == "alta"
    d = c.get("/api/alertas/vizi003-alagamento").json()
    assert d["linhaDoTempo"] and d["serie"]["unidade"] == "cm"
    assert c.get("/api/bairro").json()["nome"] == "Campo Limpo"


def test_alerta_inexistente_404():
    assert cliente_com(handler_ok()).get("/api/alertas/xyz").status_code == 404


def test_fiware_fora_503():
    def recusa(req):
        raise httpx.ConnectError("recusado", request=req)
    r = cliente_com(recusa).get("/api/sensores")
    assert r.status_code == 503 and r.json()["detail"] == "Sem conexão com o FIWARE"


def test_raiz_serve_dashboard():
    r = cliente_com(handler_ok()).get("/")
    assert r.status_code == 200 and "Vizi" in r.text and "Dados simulados" in r.text
