from datetime import datetime, timedelta, timezone

import pytest

from tests.conftest import carregar
from vizi_api.normalizar import eventos_do_sth, parse_evento, sensor_de_entidade

AGORA = datetime(2026, 11, 12, 20, 53, 10, tzinfo=timezone.utc)


def test_sensor_de_entidade_traduz_agua_para_alagamento():
    s = sensor_de_entidade(carregar("entidade_003.json"), AGORA)
    assert s.id == "vizi003"
    assert (s.lat, s.lng) == (-23.56, -46.653)
    assert s.alagamento.estado == "alagamento" and s.alagamento.nivel == 25.3
    assert s.energia.tensao == 126.4 and s.sinal.latencia == 91
    assert s.estadoGeral == "critico" and s.online is True and s.aguardando is False


def test_online_compara_em_utc():
    ent = carregar("entidade_003.json")  # TimeInstant 20:53:04.912Z
    assert sensor_de_entidade(ent, AGORA).online is True
    assert sensor_de_entidade(ent, AGORA + timedelta(seconds=31)).online is False


def test_entidade_so_com_atributos_fixos():
    s = sensor_de_entidade(carregar("entidade_vazia.json"), AGORA)
    assert s.aguardando is True and s.online is False
    assert s.energia.tensao is None and s.alagamento.estado is None and s.estadoGeral is None
    assert s.ultimaLeitura is None


def test_parse_evento_aplica_atraso_e_traduz():
    ev = parse_evento("energia,sem_energia,3.2,12", AGORA)
    assert ev.t == AGORA - timedelta(seconds=12) and ev.valor == 3.2 and ev.atrasoS == 12
    assert parse_evento("agua,alagamento,24.8,0", AGORA).servico == "alagamento"


@pytest.mark.parametrize("txt", ["lixo", "agua,alagamento,abc,0", "agua,alagamento,1.0", "", None,
                                 "agua,alagamento,1.0,-3"])
def test_parse_evento_invalido_retorna_none(txt):
    assert parse_evento(txt, AGORA) is None


def test_eventos_do_sth_descarta_invalidos_e_ordena():
    evs = eventos_do_sth(carregar("eventos_003.json"))
    assert len(evs) == 3
    assert evs == sorted(evs, key=lambda e: e.t)
