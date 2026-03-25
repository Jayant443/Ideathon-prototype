from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from contextlib import asynccontextmanager
import os
from src.database import connect_to_mongodb, close_mongodb_connection
from src.routes.dispatch import dispatch_router
from fastapi import WebSocket, WebSocketDisconnect
from src.connection_manager import manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongodb()
    yield
    await close_mongodb_connection()

app = FastAPI(title="Ideathon project", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.websocket("/ws/{authority_id}")
async def websocket_endpoint(websocket: WebSocket, authority_id: int):
    await manager.connect(authority_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(authority_id)

app.include_router(dispatch_router, prefix="/dispatch")

@app.get("/")
def root():
    return {"message": "Hello"}

