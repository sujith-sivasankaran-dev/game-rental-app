from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class AddressBase(BaseModel):
    label: str = Field(..., description="Address label (Home, Office, etc.)")
    full_address: str = Field(..., description="Full text address")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    landmark: Optional[str] = Field(None, description="Nearby landmark")
    phone: Optional[str] = Field(None, description="Contact phone for this address")

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    label: Optional[str] = None
    full_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    landmark: Optional[str] = None
    phone: Optional[str] = None

class AddressResponse(AddressBase):
    id: str
    user_id: str
    is_default: bool = False
    created_at: datetime
    updated_at: datetime

class AddressInDB(AddressBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    is_default: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
