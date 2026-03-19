from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import os
from src.database import connect_to_mongodb, close_mongodb_connection, get_database
from src.routes.dispatch import dispatch_router

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = "Report"

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

app.include_router(dispatch_router, prefix=f"dispatch")

@app.get("/")
def root():
    return {"message": "Hello"}

