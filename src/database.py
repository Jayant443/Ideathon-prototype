from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from src.config import MONGODB_URI, DB_NAME
from typing import Optional

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

db = Database()

async def connect_to_mongodb():
    db.client = AsyncIOMotorClient(MONGODB_URI)
    db.database = db.client[DB_NAME]
    print("Connected successfully")

async def close_mongodb_connection() -> None:
    if db.client:
        db.client.close()
        db.client = None
        db.database = None
        print("Disconnected")

def get_database() -> AsyncIOMotorDatabase:
    if db.database is None:
        raise RuntimeError("Database not initialized")
    return db.database