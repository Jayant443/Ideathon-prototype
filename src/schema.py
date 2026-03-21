from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime

class DispatchStatus(str, Enum):
    PENDING = "pending"
    OPEN = "open"
    RESOLVED = "resolved"
    
class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    UNKNOWN = "unknown"

class Geolocation(BaseModel):
    lat: float
    lng: float

class Dispatch(BaseModel):
    location: dict
    description: str
    severity: Optional[Severity]
    status: DispatchStatus = DispatchStatus.OPEN
    timestamp: datetime
    ai_description: Optional[str] = None
    image_url: Optional[str] = None

class DispatchResponse(BaseModel):
    dispatch_id: str
    severity: Optional[Severity]
    status: DispatchStatus = DispatchStatus.OPEN
    location: Geolocation
    description: str
    timestamp: datetime
    ai_description: Optional[str] = None
    image_url: Optional[str]
