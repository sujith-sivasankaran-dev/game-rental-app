from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime

class CouponBase(BaseModel):
    code: str
    discount_type: Literal["Flat", "Percentage"]
    discount_value: float = Field(gt=0)
    applicable_to: Literal["All", "Product Type", "Specific Product"]
    applicable_product_type: Optional[str] = None
    applicable_product_id: Optional[str] = None
    usage_limit: int = Field(ge=0)
    per_user_limit: int = Field(ge=0)
    restricted_users: Optional[List[str]] = []
    expiry_date: datetime
    min_order_value: Optional[float] = 0.0
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    discount_type: Optional[Literal["Flat", "Percentage"]] = None
    discount_value: Optional[float] = None
    applicable_to: Optional[Literal["All", "Product Type", "Specific Product"]] = None
    applicable_product_type: Optional[str] = None
    applicable_product_id: Optional[str] = None
    usage_limit: Optional[int] = None
    per_user_limit: Optional[int] = None
    restricted_users: Optional[List[str]] = None
    expiry_date: Optional[datetime] = None
    min_order_value: Optional[float] = None
    is_active: Optional[bool] = None

class CouponResponse(CouponBase):
    id: str
    times_used: int = 0
    created_at: datetime
    updated_at: datetime

class CouponValidation(BaseModel):
    is_valid: bool
    discount_amount: float = 0.0
    message: str

class CouponUsage(BaseModel):
    coupon_id: str
    coupon_code: str
    user_id: str
    rental_id: str
    discount_amount: float
    used_at: datetime