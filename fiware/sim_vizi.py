"""Simulador dos sensores Vizi para o FIWARE local.

Imita o firmware do ESP32 (mesmos limites, mesma suavizacao, mesmo payload
UltraLight) para que o dashboard tenha varios sensores no mapa sem depender
do Wokwi. Cada sensor tem um "roteiro" de incidentes:

  vizi002 (Praca Central)          -> quedas de energia e de sinal
  vizi003 (Corrego da Av. Brasil)  -> agua subindo ate alagar e baixando
  vizi001 (Poste 01)               -> so com --com-wokwi (quando o Wokwi
                                      estiver fora); senao quem publica e o
                                      ESP32 simulado no Wokwi

Uso:
  python sim_vizi.py                 # vizi002 e vizi003
  python sim_vizi.py --com-wokwi     # inclui vizi001
  python sim_vizi.py --rapido        # incidentes mais frequentes (demo)
"""

import argparse
import functools
import random
import time
from collections import deque

import paho.mqtt.client as mqtt

print = functools.partial(print, flush=True)  # log aparece na hora

BROKER = "localhost"
INTERVALO_LEITURA = 1.0
INTERVALO_PUBLICACAO = 5.0

# Limites: os mesmos do firmware (sketch.ino)
V_SEM_ENERGIA, V_INSTAVEL_MIN, V_INSTAVEL_MAX, HIST_V = 110.0, 117.0, 133.0, 2.0
LAT_INSTAVEL, LAT_FALHA, HIST_MS, FALHAS_SEM_SINAL = 300.0, 1000.0, 30.0, 3
AGUA_ATENCAO, AGUA_ALAGAMENTO, HIST_CM = 8.0, 15.0, 1.5
JANELA, CONFIRMACOES = 5, 3

NORMAL, ATENCAO, FALHA = 0, 1, 2
TEXTOS = {
    "energia": ("normal", "instavel", "sem_energia"),
    "sinal": ("ok", "instavel", "sem_sinal"),
    "agua": ("normal", "atencao", "alagamento"),
}


def classificar_energia(v, atual):
    m = HIST_V if atual != NORMAL else 0
    if v < V_SEM_ENERGIA + (m if atual == FALHA else 0):
        return FALHA
    if v < V_INSTAVEL_MIN + m or v > V_INSTAVEL_MAX - m:
        return ATENCAO
    return NORMAL


def classificar_sinal(lat, falhas, atual):
    if falhas >= FALHAS_SEM_SINAL:
        return FALHA
    m = HIST_MS if atual != NORMAL else 0
    if falhas > 0 or lat >= LAT_INSTAVEL - m:
        return ATENCAO
    return NORMAL


def classificar_agua(nivel, atual):
    m = HIST_CM if atual != NORMAL else 0
    if nivel > AGUA_ALAGAMENTO - (m if atual == FALHA else 0):
        return FALHA
    if nivel >= AGUA_ATENCAO - m:
        return ATENCAO
    return NORMAL


class Servico:
    def __init__(self, nome):
        self.nome = nome
        self.janela = deque(maxlen=JANELA)
        self.estado = NORMAL
        self.candidato = NORMAL
        self.confirmacoes = 0
        self.seg_em_falha = 0.0

    def media(self):
        return sum(self.janela) / len(self.janela) if self.janela else 0.0

    def confirmar(self, novo):
        """Retorna o novo estado quando a troca e confirmada, senao None."""
        if novo == self.estado:
            self.confirmacoes = 0
            self.candidato = novo
            return None
        if novo != self.candidato:
            self.candidato, self.confirmacoes = novo, 1
        else:
            self.confirmacoes += 1
        if self.confirmacoes < CONFIRMACOES:
            return None
        self.estado, self.confirmacoes = novo, 0
        return novo


class Sensor:
    """Um sensor simulado com um roteiro de incidentes."""

    def __init__(self, device_id, perfil, rapido):
        self.id = device_id
        self.perfil = perfil
        self.topico = f"/TEF/{device_id}/attrs"
        self.energia, self.sinal, self.agua = Servico("energia"), Servico("sinal"), Servico("agua")
        self.falhas_rede = 0
        self.fator = 4 if rapido else 1
        self.incidente = None        # (tipo, segundos restantes)
        self.t_ultima_pub = 0.0
        self.publicar_agora = False

    # --- leituras "cruas" com ruido, puxadas pelo incidente atual ---
    def sortear_incidente(self):
        if self.incidente:
            tipo, resta = self.incidente
            self.incidente = (tipo, resta - INTERVALO_LEITURA) if resta > 0 else None
            return
        chance = 0.004 * self.fator
        if random.random() < chance:
            if self.perfil == "energia":
                tipo = random.choice(["queda", "queda", "oscilacao", "sem_rede", "lenta"])
            elif self.perfil == "agua":
                tipo = "chuva"
            else:
                tipo = random.choice(["queda", "oscilacao", "chuva", "lenta"])
            self.incidente = (tipo, random.uniform(40, 120))
            print(f"[{self.id}] incidente: {tipo}")

    def ler(self, t):
        tipo = self.incidente[0] if self.incidente else None
        resta = self.incidente[1] if self.incidente else 0

        tensao = random.gauss(127, 1.2)
        if tipo == "queda":
            tensao = random.uniform(0, 15)
        elif tipo == "oscilacao":
            tensao = random.gauss(112, 2)

        latencia = abs(random.gauss(90, 20))
        falhou = False
        if tipo == "lenta":
            latencia = random.gauss(550, 80)
        elif tipo == "sem_rede":
            falhou = True

        nivel = max(0.0, random.gauss(1.5, 0.5))
        if tipo == "chuva":
            # sobe ate ~25 cm no meio do incidente e depois baixa
            nivel = max(0.0, 25 * min(1.0, resta / 40) + random.gauss(0, 0.8))
        return tensao, latencia, falhou, nivel

    # --- logica de borda (igual ao firmware) ---
    def ciclo(self, t, eventos):
        self.sortear_incidente()
        tensao, latencia, falhou, nivel = self.ler(t)

        for serv, valor, classif in ((self.energia, tensao, classificar_energia),
                                     (self.agua, nivel, classificar_agua)):
            serv.janela.append(valor)
            novo = serv.confirmar(classif(serv.media(), serv.estado))
            if novo is not None:
                eventos.append((serv, novo))

        self.falhas_rede = self.falhas_rede + 1 if falhou or latencia >= LAT_FALHA else 0
        self.sinal.janela.append(latencia)
        novo = self.sinal.confirmar(classificar_sinal(self.sinal.media(), self.falhas_rede, self.sinal.estado))
        if novo is not None:
            eventos.append((self.sinal, novo))

        for s in (self.energia, self.sinal, self.agua):
            if s.estado == FALHA:
                s.seg_em_falha += INTERVALO_LEITURA

    def geral(self):
        pior = max(self.energia.estado, self.sinal.estado, self.agua.estado)
        return ("normal", "atencao", "critico")[pior]

    def payload(self):
        e, n, a = self.energia, self.sinal, self.agua
        return (f"e|{e.media():.1f}|es|{TEXTOS['energia'][e.estado]}"
                f"|n|{n.media():.0f}|ns|{TEXTOS['sinal'][n.estado]}"
                f"|a|{a.media():.1f}|as|{TEXTOS['agua'][a.estado]}"
                f"|g|{self.geral()}|te|{int(e.seg_em_falha // 60)}|tn|{int(n.seg_em_falha // 60)}|q|0")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--com-wokwi", action="store_true", help="simula tambem o vizi001")
    ap.add_argument("--rapido", action="store_true", help="incidentes mais frequentes")
    ap.add_argument("--broker", default=BROKER)
    args = ap.parse_args()

    sensores = [Sensor("vizi002", "energia", args.rapido), Sensor("vizi003", "agua", args.rapido)]
    if args.com_wokwi:
        sensores.insert(0, Sensor("vizi001", "misto", args.rapido))

    cliente = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=f"vizi-sim-{random.randint(0, 9999)}")
    cliente.connect(args.broker, 1883)
    cliente.loop_start()
    print(f"Simulando {', '.join(s.id for s in sensores)} em {args.broker}:1883 (Ctrl+C para parar)")

    try:
        while True:
            agora = time.time()
            for s in sensores:
                eventos = []
                s.ciclo(agora, eventos)
                for serv, novo in eventos:
                    texto = TEXTOS[serv.nome][novo]
                    msg = f"ev|{serv.nome},{texto},{serv.media():.1f},0"
                    cliente.publish(s.topico, msg)
                    print(f"[{s.id}] {serv.nome} -> {texto}")
                    s.publicar_agora = True
                # sem rede o sensor real guardaria os eventos; aqui so nao publica a telemetria
                sem_rede = s.sinal.estado == FALHA
                if not sem_rede and (s.publicar_agora or agora - s.t_ultima_pub >= INTERVALO_PUBLICACAO):
                    cliente.publish(s.topico, s.payload())
                    s.t_ultima_pub, s.publicar_agora = agora, False
            time.sleep(INTERVALO_LEITURA)
    except KeyboardInterrupt:
        pass
    finally:
        cliente.loop_stop()
        cliente.disconnect()


if __name__ == "__main__":
    main()
