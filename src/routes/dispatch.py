from fastapi import APIRouter, File, Form, UploadFile, HTTPException
import asyncio
import cloudinary
import cloudinary.uploader
from typing import Optional
from bson import ObjectId
from src.schema import Dispatch, DispatchResponse, DispatchStatus, Severity, Geolocation
from src.routes.ai_response import call_ai_model
from datetime import datetime, timedelta
from src.database import get_database
from src.config import CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME

dispatch_router = APIRouter()

async def check_duplicate(lat: float, lng: float) -> dict | None:
    db = get_database()
    dispatch_collection = db["dispatches"]
    cutoff = datetime.utcnow() - timedelta(minutes=15)
    return await dispatch_collection.find_one({
        "timestamp": {"$gte": cutoff},
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": 100
            }
        }
    })

async def upload_to_cloudinary(image_bytes: bytes) -> str:
    cloudinary.config(
        cloud_name=CLOUDINARY_CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET
    )
    result = await asyncio.to_thread(cloudinary.uploader.upload, image_bytes)
    return result["secure_url"]

def serialize_dispatch(doc: dict) -> DispatchResponse:
    location = doc.get("location", {})
    coords = location.get("coordinates", [0.0, 0.0])
    return DispatchResponse(
        dispatch_id=str(doc["_id"]),
        severity=doc.get("severity"),
        status=doc.get("status"),
        location=Geolocation(lat=coords[1], lng=coords[0]),
        description=doc.get("description", ""),
        timestamp=doc.get("timestamp"),
        ai_description=doc.get("ai_description", ""),
        image_url=doc.get("image_url")
    )

@dispatch_router.post("/report")
async def report_dispatch(lat: float = Form(...), lng: float = Form(...), description: str = Form(""), image: UploadFile = File(...)):
    db = get_database()
    dispatch_collection = db["dispatches"]
    existing = await check_duplicate(lat, lng)
    if existing:
        return {"message": "This dispatch is already reported"}
    image_bytes = await image.read()
    dispatch_doc = {
        "location": {"type": "Point", "coordinates": [lng, lat]},
        "description": description,
        "severity": None,
        "status": DispatchStatus.PENDING,
        "timestamp": datetime.utcnow(),
        "ai_description": None,
        "image_url": None
    }
    result = await dispatch_collection.insert_one(dispatch_doc)
    dispatch_id = result.inserted_id

    ai_response, image_url = await asyncio.gather(call_ai_model(image_bytes), upload_to_cloudinary(image_bytes))
    severity = Severity(ai_response.get("severity", "unknown"))
    ai_description = ai_response.get("ai_description")

    await dispatch_collection.update_one(
        {"_id": dispatch_id},
        {"$set": {
            "severity": severity,
            "status": DispatchStatus.OPEN,
            "ai_description": ai_description,
            "image_url": image_url
        }}
    )

    updated_doc = await dispatch_collection.find_one({"_id": ObjectId(dispatch_id)})
    return serialize_dispatch(updated_doc)

@dispatch_router.get("/get")
async def get_all_dispatches(lng: float, lat: float):
    db = get_database()
    dispatch_collection = db["dispatches"]
    cursor = dispatch_collection.find({
        "location": {
            "$near": {
                "$geometry": {"type": "Point", "coordinates": [lng, lat]},
                "$maxDistance": 1000
            }
        }
    })
    docs = await cursor.to_list(length=200)
    return [serialize_dispatch(d) for d in docs]

@dispatch_router.get("/get/{dispatch_id}")
async def get_dispatch(dispatch_id: str):
    db = get_database()
    dispatch_collection = db["dispatches"]
    doc = await dispatch_collection.find_one({"_id": ObjectId(dispatch_id)})
    if not doc:
        return HTTPException(status_code=404, detail="Dispatch not found")
    return serialize_dispatch(doc)


