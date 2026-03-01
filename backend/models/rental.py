from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class DeliveryAddress(BaseModel):
    address_id: Optional[str] = None
    full_address: str
    latitude: float
    longitude: float
    landmark: Optional[str] = None
    phone: Optional[str] = None

class RentalCreate(BaseModel):
    product_id: str
    start_date: datetime
    rental_duration: int = Field(gt=0)  # in hours
    coupon_code: Optional[str] = None
    delivery_address: Optional[DeliveryAddress] = None

class RentalExtension(BaseModel):
    extension_duration: int = Field(gt=0)  # in hours

class RentalResponse(BaseModel):
    id: str
    user_id: str
    product_id: str
    product_name: str
    product_photo: Optional[str] = None
    start_date: datetime
    end_date: datetime
    extended_end_date: Optional[datetime] = None
    status: Literal["active", "extended", "completed", "cancelled"]
    base_price: float
    extension_price: float = 0.0
    discount_amount: float = 0.0
    total_price: float
    coupon_code: Optional[str] = None
    delivery_address: Optional[DeliveryAddress] = None
    created_at: datetime
    updated_at: datetime

class RentalInDB(BaseModel):
    id: str
    user_id: str
    product_id: str
    start_date: datetime
    end_date: datetime
    extended_end_date: Optional[datetime] = None
    status: str
    base_price: float
    extension_price: float = 0.0
    discount_amount: float = 0.0
    total_price: float
    coupon_code: Optional[str] = None
    delivery_address: Optional[dict] = None
    created_at: datetime
    updated_at: datetime