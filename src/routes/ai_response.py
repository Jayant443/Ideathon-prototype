import httpx
from src.config import AI_MODEL_URL
import random

async def call_ai_model(image_bytes: bytes = None) -> dict:
    if image_bytes:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.post(AI_MODEL_URL, files={"file": ("image.jpg", image_bytes, "image/jpeg")})
                data = response.json()
                return data
        except Exception as e:
            return await analyze_image()

async def analyze_image():
    severity = random.choice(["low", "medium", "high"])
    ai_description = {
        "low": "Minor vehicle damage detected, no visible injuries.",
        "medium": "Moderate collision detected, possible injuries.",
        "high": "Severe accident detected, multiple vehicles involved, likely injuries."
    }
    return {
        "severity": severity,
        "ai_description": ai_description[severity]
    }