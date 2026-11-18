"""Configuracao da API (variaveis de ambiente com padrao para o FIWARE local)."""

import os
from dataclasses import dataclass, field


@dataclass
class Config:
    orion_url: str = field(default_factory=lambda: os.getenv("ORION_URL", "http://localhost:1026"))
    sth_url: str = field(default_factory=lambda: os.getenv("STH_URL", "http://localhost:8666"))
    limite_online_s: int = 30   # sem leitura ha mais que isso = sensor sem comunicacao
