"""Contrato de dados da API do Vizi (o mesmo que o app de Front vai usar).

Nomes em portugues e camelCase. A API so repassa o estado que o ESP32
decidiu; nenhum campo aqui e calculado a partir de limites.
"""

from datetime import datetime

from pydantic import BaseModel


class Energia(BaseModel):
    estado: str | None = None        # normal, instavel, sem_energia, erro_sensor
    tensao: float | None = None      # V (media movel do sensor)
    minutosSem: int | None = None    # acumulado pelo sensor


class Sinal(BaseModel):
    estado: str | None = None        # ok, instavel, sem_sinal
    latencia: float | None = None    # ms
    minutosSem: int | None = None


class Alagamento(BaseModel):
    estado: str | None = None        # normal, atencao, alagamento, erro_sensor
    nivel: float | None = None       # cm de agua acima da rua


class Sensor(BaseModel):
    id: str
    nome: str | None = None
    lat: float | None = None
    lng: float | None = None
    origem: str | None = None        # wokwi ou simulador
    online: bool
    aguardando: bool                 # provisionado, ainda sem nenhuma leitura
    ultimaLeitura: datetime | None = None
    estadoGeral: str | None = None   # normal, atencao, critico
    energia: Energia
    sinal: Sinal
    alagamento: Alagamento
    filaOffline: int | None = None
    dadosSimulados: bool = True


class Evento(BaseModel):
    """Relato automatico: o sensor mudou de estado."""
    t: datetime
    servico: str                     # energia, sinal, alagamento
    estado: str
    valor: float
    atrasoS: int                     # segundos que ficou na fila offline


class Alerta(BaseModel):
    """Mesmo formato de um relato de morador no app (fonte = sensor)."""
    id: str
    tipo: str                        # energia, sinal, alagamento, sensor
    titulo: str
    local: str | None = None
    lat: float | None = None
    lng: float | None = None
    desde: datetime | None = None
    gravidade: str                   # alta, media
    status: str = "detectado"
    fonte: str = "sensor"
    sensorId: str
    valor: float | None = None
    unidade: str | None = None


class PontoSerie(BaseModel):
    t: datetime
    v: float


class Serie(BaseModel):
    medida: str
    unidade: str
    pontos: list[PontoSerie]
    faixas: dict[str, float]         # so para desenhar; quem decide e o ESP32


class ItemLinhaDoTempo(BaseModel):
    t: datetime
    texto: str


class AlertaDetalhe(Alerta):
    minutosSemServico: int | None = None
    linhaDoTempo: list[ItemLinhaDoTempo] = []
    serie: Serie | None = None


class MinutosTipo(BaseModel):
    tipo: str
    minutos: int


class Bairro(BaseModel):
    nome: str
    horasSemServico: float
    porTipo: list[MinutosTipo]
    alertasAtivos: int
    sensores: int
    sensoresOnline: int


class Saude(BaseModel):
    orion: bool
    sth: bool
