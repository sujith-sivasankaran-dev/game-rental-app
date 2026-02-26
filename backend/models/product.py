from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    description: str
    product_type: Literal["Console", "Accessory", "Game"]
    compatibility: Literal["PS5", "PS4", "PS4 & PS5", "Xbox One", "Xbox Series X/S"]
    rental_price: float = Field(gt=0)
    min_rental_period: int = Field(gt=0)
    min_rental_unit: Literal["Hour", "Day"] = "Day"
    extension_rule: Literal["Hourly", "Half Day", "Full Day Only"] = "Full Day Only"
    extension_multiplier: float = Field(default=1.0, gt=0)
    total_stock: int = Field(ge=0)
    is_active: bool = True

class ProductCreate(ProductBase):
    photo_url: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    product_type: Optional[Literal["Console", "Accessory", "Game"]] = None
    compatibility: Optional[Literal["PS5", "PS4", "PS4 & PS5", "Xbox One", "Xbox Series X/S"]] = None
    rental_price: Optional[float] = None
    min_rental_period: Optional[int] = None
    min_rental_unit: Optional[Literal["Hour", "Day"]] = None
    extension_rule: Optional[Literal["Hourly", "Half Day", "Full Day Only"]] = None
    extension_multiplier: Optional[float] = None
    total_stock: Optional[int] = None
    is_active: Optional[bool] = None
    photo_url: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    photo_url: Optional[str] = None
    available_stock: int
    created_at: datetime
    updated_at: datetime

class ProductWithHistory(ProductResponse):
    rental_history: list = []