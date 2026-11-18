from datetime import datetime, timedelta, timezone

from vizi_api.alertas import alertas_do_sensor, bairro, detalhe, ordenar_alertas
from vizi_api.modelos import Alagamento, Alerta, Energia, Evento, Sensor, Sinal

AGORA = datetime(2026, 11, 12, 21, 0, 0, tzinfo=timezone.utc)
T1, T2, T3 = (AGORA - timedelta(minutes=m) for m in (30, 20, 10))


def sensor(**kw):
    base = dict(id="vizi001", nome="Poste 01 - Rua das Flores", lat=-23.648, lng=-46.759,
                origem="wokwi", online=True, aguardando=False, ultimaLeitura=AGORA,
                estadoGeral="normal", energia=Energia(estado="normal", tensao=127, minutosSem=0),
                sinal=Sinal(estado="ok", latencia=80, minutosSem=0),
                alagamento=Alagamento(estado="normal", nivel=1.0), filaOffline=0)
    base.update(kw)
    return Sensor(**base)


def ev(servico, estado, valor, t, atraso=0):
    return Evento(t=t, servico=servico, estado=estado, valor=valor, atrasoS=atraso)


def al(gravidade, desde):
    return Alerta(id=f"x-{gravidade}-{desde}", tipo="energia", titulo="x", gravidade=gravidade,
                  desde=desde, sensorId="x")


def test_alertas_so_para_servicos_fora_do_normal():
    s = sensor(energia=Energia(estado="sem_energia", tensao=3.2, minutosSem=2),
               alagamento=Alagamento(estado="atencao", nivel=9.0))
    a = {x.tipo: x for x in alertas_do_sensor(s, [], AGORA)}
    assert set(a) == {"energia", "alagamento"}
    assert a["energia"].titulo == "Sem energia" and a["energia"].gravidade == "alta"
    assert a["energia"].unidade == "V" and a["energia"].valor == 3.2
    assert a["energia"].id == "vizi001-energia" and a["energia"].fonte == "sensor"
    assert a["alagamento"].titulo == "Água subindo na rua" and a["alagamento"].gravidade == "media"
    assert a["alagamento"].unidade == "cm"


def test_desde_vem_do_ultimo_evento_com_estado_atual():
    s = sensor(energia=Energia(estado="sem_energia", tensao=3.0, minutosSem=5))
    evs = [ev("energia", "sem_energia", 2, T1), ev("energia", "normal", 127, T2),
           ev("energia", "sem_energia", 3, T3)]
    assert alertas_do_sensor(s, evs, AGORA)[0].desde == T3


def test_erro_sensor_vira_alerta_media():
    s = sensor(alagamento=Alagamento(estado="erro_sensor", nivel=None))
    a = alertas_do_sensor(s, [], AGORA)[0]
    assert a.titulo == "Sensor com defeito (alagamento)" and a.gravidade == "media"


def test_sensor_offline_gera_alerta_sensor_e_mantem_os_outros():
    s = sensor(online=False, sinal=Sinal(estado="instavel", latencia=600, minutosSem=0))
    alertas = alertas_do_sensor(s, [], AGORA)
    assert sorted(x.tipo for x in alertas) == ["sensor", "sinal"]
    off = next(x for x in alertas if x.tipo == "sensor")
    assert off.titulo == "Sensor sem comunicação" and off.gravidade == "media"
    assert off.id == "vizi001-sensor" and off.desde == AGORA


def test_sensor_aguardando_nao_gera_alerta():
    s = sensor(online=False, aguardando=True, ultimaLeitura=None,
               energia=Energia(), sinal=Sinal(), alagamento=Alagamento())
    assert alertas_do_sensor(s, [], AGORA) == []


def test_ordem_gravidade_depois_recente_e_sem_data_no_fim():
    r = ordenar_alertas([al("media", T3), al("alta", T1), al("alta", None), al("alta", T2)])
    assert [(x.gravidade, x.desde) for x in r] == [("alta", T2), ("alta", T1), ("alta", None), ("media", T3)]


def test_detalhe_linha_do_tempo_e_minutos():
    evs = [ev("energia", "normal", 127.0, AGORA - timedelta(minutes=20)),
           ev("energia", "sem_energia", 3.2, AGORA - timedelta(minutes=11), atraso=12)]
    s = sensor(energia=Energia(estado="sem_energia", tensao=3.2, minutosSem=0))
    a = alertas_do_sensor(s, evs, AGORA)[0]
    d = detalhe(a, evs, [], AGORA)
    assert d.minutosSemServico == 11
    assert d.linhaDoTempo[0].texto == "Sensor detectou falta de energia (3,2 V) · enviado 12 s depois (sem rede)"
    assert d.linhaDoTempo[1].texto == "Serviço normalizado"
    assert d.serie.medida == "tensao" and d.serie.faixas == {"atencao": 117, "falha": 110}


def test_detalhe_do_alerta_sensor_nao_tem_serie():
    a = next(x for x in alertas_do_sensor(sensor(online=False), [], AGORA) if x.tipo == "sensor")
    assert detalhe(a, [], [], AGORA).serie is None


def test_bairro_soma_minutos_e_intervalos_de_alagamento():
    sens = [sensor(id="a", energia=Energia(estado="normal", tensao=127, minutosSem=20)),
            sensor(id="b", energia=Energia(estado="normal", tensao=127, minutosSem=3),
                   sinal=Sinal(estado="ok", latencia=50, minutosSem=4), online=False)]
    evs = {"b": [ev("alagamento", "alagamento", 20, AGORA - timedelta(minutes=30)),
                 ev("alagamento", "atencao", 9, AGORA - timedelta(minutes=21)),
                 ev("alagamento", "alagamento", 18, AGORA - timedelta(minutes=5))]}
    b = bairro(sens, evs, [al("alta", T1)], AGORA)
    assert {m.tipo: m.minutos for m in b.porTipo} == {"energia": 23, "sinal": 4, "alagamento": 14}
    assert b.horasSemServico == 0.7 and b.sensores == 2 and b.sensoresOnline == 1
    assert b.alertasAtivos == 1 and b.nome == "Campo Limpo"


def test_bairro_ignora_intervalo_sem_fechamento_quando_sensor_reinicia():
    # sensor reiniciou alagado: entrou em alagamento duas vezes sem evento de saida no meio
    evs = {"b": [ev("alagamento", "alagamento", 24, AGORA - timedelta(minutes=90)),
                 ev("alagamento", "alagamento", 25, AGORA - timedelta(minutes=4))]}
    b = bairro([sensor(id="b")], evs, [], AGORA)
    assert {m.tipo: m.minutos for m in b.porTipo}["alagamento"] == 4
