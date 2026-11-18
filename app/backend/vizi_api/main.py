"""API do Vizi: camada 3 do sensor (le o FIWARE e entrega no formato do app).

Rodar:  .venv/bin/uvicorn vizi_api.main:app --port 8010
Abre o dashboard de teste em http://localhost:8010
"""

from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from .config import Config
from .fiware import Fiware, FiwareIndisponivel
from .modelos import AlertaDetalhe, Alerta, Bairro, Saude, Sensor

DASHBOARD = Path(__file__).resolve().parents[1] / "static" / "index.html"


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with httpx.AsyncClient() as cliente:
        app.state.fiware = Fiware(Config(), cliente)
        yield


app = FastAPI(title="API Vizi", version="1.0", lifespan=lifespan)
# o app de Front (Vite, porta 5173) pode consumir a API em desenvolvimento
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["GET"])


def get_fiware(request: Request) -> Fiware:
    return request.app.state.fiware


@app.exception_handler(FiwareIndisponivel)
async def fiware_fora(request: Request, exc: FiwareIndisponivel):
    return JSONResponse(status_code=503, content={"detail": "Sem conexão com o FIWARE"})


@app.get("/api/health")
async def health(fw: Fiware = Depends(get_fiware)) -> Saude:
    return await fw.saude()


@app.get("/api/sensores")
async def sensores(fw: Fiware = Depends(get_fiware)) -> list[Sensor]:
    return await fw.sensores()


@app.get("/api/alertas")
async def alertas(fw: Fiware = Depends(get_fiware)) -> list[Alerta]:
    return await fw.alertas()


@app.get("/api/alertas/{alerta_id}")
async def alerta(alerta_id: str, fw: Fiware = Depends(get_fiware)) -> AlertaDetalhe:
    detalhe = await fw.alerta(alerta_id)
    if detalhe is None:
        raise HTTPException(status_code=404, detail="Alerta não encontrado (o serviço pode ter normalizado)")
    return detalhe


@app.get("/api/bairro")
async def bairro(fw: Fiware = Depends(get_fiware)) -> Bairro:
    return await fw.bairro()


@app.get("/", include_in_schema=False)
async def dashboard():
    return FileResponse(DASHBOARD)
