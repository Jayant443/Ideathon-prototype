from fastapi import APIRouter, File, Form, UploadFile
import asyncio
import cloudinary
import cloudinary.uploader
from src.models import Dispatch, DispatchResponse, DispatchStatus, Severity, Geolocation
from datetime import datetime, timedelta
from src.database import get_database
from src.config import CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME

db = get_database()
dispatch_collection = db["dispatches"]

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET
)

dispatch_router = APIRouter()

async def check_duplicate(lat: float, lng: float) -> dict | None:
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
    result = await asyncio.to_thread(cloudinary.uploader.upload, image_bytes)
    return result["secure_url"]

@dispatch_router.post("/report")
async def report_dispatch(lat: str = Form(...), lng: str = Form(...), description: str = Form(""), image: UploadFile = File(...)):
    existing = check_duplicate(lat, lng)
    if existing:
        return {"message": "This dispatch is already reported"}
    image_bytes = await image.read()
    dispatch_doc = {
        "location": {"type": "Point", "coordinates": [lng, lat]},
        "description": description,
        "severity": None,
        "status": DispatchStatus.ACKNOWLEDGED,
        "timestamp": datetime.utcnow(),
        "image_url": None
    }
    result = await dispatch_collection.insert_one(dispatch_doc)
    dispatch_id = result.inserted_id

    image_url = await asyncio.gather(upload_to_cloudinary(image_bytes))

    severity = Severity.UNKNOWN

    await dispatch_collection.update_one(
        {"_id": dispatch_id},
        {"$set": {
            "severity": severity,
            "status": DispatchStatus.OPEN,
            "image_url": image_url
        }}
    )

    return {
        "message": "Dispatch reported successfully",
        "dispatch_id": str(dispatch_id),
        "severity": severity
    }
