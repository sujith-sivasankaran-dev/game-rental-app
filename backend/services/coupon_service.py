from backend.config import db
from backend.models.coupon import CouponCreate, CouponUpdate, CouponResponse, CouponValidation, CouponUsage
from datetime import datetime
from uuid import uuid4
from typing import List, Optional
import random
import string

class CouponService:
    @staticmethod
    def generate_coupon_code(length: int = 8) -> str:
        """Generate a random coupon code"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
    
    @staticmethod
    async def create_coupon(coupon_data: CouponCreate) -> CouponResponse:
        coupons_collection = db.get_db()["coupons"]
        
        # Check if code already exists
        existing = await coupons_collection.find_one({"code": coupon_data.code})
        if existing:
            # Generate new code if exists
            coupon_data.code = CouponService.generate_coupon_code()
        
        coupon_dict = {
            "id": str(uuid4()),
            **coupon_data.model_dump(),
            "times_used": 0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await coupons_collection.insert_one(coupon_dict)
        
        return CouponResponse(**coupon_dict)
    
    @staticmethod
    async def get_coupon(coupon_id: str) -> Optional[CouponResponse]:
        coupons_collection = db.get_db()["coupons"]
        coupon = await coupons_collection.find_one({"id": coupon_id})
        
        if not coupon:
            return None
        
        return CouponResponse(**coupon)
    
    @staticmethod
    async def get_coupon_by_code(code: str) -> Optional[CouponResponse]:
        coupons_collection = db.get_db()["coupons"]
        coupon = await coupons_collection.find_one({"code": code})
        
        if not coupon:
            return None
        
        return CouponResponse(**coupon)
    
    @staticmethod
    async def list_coupons(is_active: Optional[bool] = None) -> List[CouponResponse]:
        coupons_collection = db.get_db()["coupons"]
        
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        
        cursor = coupons_collection.find(query).sort("created_at", -1)
        coupons = await cursor.to_list(length=100)
        
        return [CouponResponse(**coupon) for coupon in coupons]
    
    @staticmethod
    async def update_coupon(coupon_id: str, coupon_data: CouponUpdate) -> Optional[CouponResponse]:
        coupons_collection = db.get_db()["coupons"]
        
        update_data = {k: v for k, v in coupon_data.model_dump(exclude_unset=True).items() if v is not None}
        
        if not update_data:
            return await CouponService.get_coupon(coupon_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await coupons_collection.find_one_and_update(
            {"id": coupon_id},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            return None
        
        return CouponResponse(**result)
    
    @staticmethod
    async def delete_coupon(coupon_id: str) -> bool:
        coupons_collection = db.get_db()["coupons"]
        result = await coupons_collection.delete_one({"id": coupon_id})
        return result.deleted_count > 0
    
    @staticmethod
    async def validate_coupon(
        code: str,
        user_id: str,
        product_id: str,
        product_type: str,
        order_value: float
    ) -> CouponValidation:
        """
        Validate coupon against all rules
        """
        coupons_collection = db.get_db()["coupons"]
        usage_collection = db.get_db()["coupon_usage"]
        
        coupon = await coupons_collection.find_one({"code": code})
        
        if not coupon:
            return CouponValidation(is_valid=False, message="Coupon not found")
        
        if not coupon.get("is_active", False):
            return CouponValidation(is_valid=False, message="Coupon is inactive")
        
        # Check expiry
        if coupon["expiry_date"] < datetime.utcnow():
            return CouponValidation(is_valid=False, message="Coupon has expired")
        
        # Check minimum order value
        if coupon.get("min_order_value", 0) > order_value:
            return CouponValidation(
                is_valid=False,
                message=f"Minimum order value is {coupon['min_order_value']}"
            )
        
        # Check usage limit
        if coupon["times_used"] >= coupon["usage_limit"]:
            return CouponValidation(is_valid=False, message="Coupon usage limit reached")
        
        # Check per-user limit
        user_usage = await usage_collection.count_documents({
            "coupon_code": code,
            "user_id": user_id
        })
        
        if user_usage >= coupon["per_user_limit"]:
            return CouponValidation(is_valid=False, message="Per user limit reached")
        
        # Check restricted users
        if coupon.get("restricted_users") and user_id in coupon["restricted_users"]:
            return CouponValidation(is_valid=False, message="Coupon not available for this user")
        
        # Check applicability
        applicable_to = coupon["applicable_to"]
        if applicable_to == "Product Type":
            if coupon.get("applicable_product_type") != product_type:
                return CouponValidation(
                    is_valid=False,
                    message=f"Coupon only applicable to {coupon['applicable_product_type']}"
                )
        elif applicable_to == "Specific Product":
            if coupon.get("applicable_product_id") != product_id:
                return CouponValidation(is_valid=False, message="Coupon not applicable to this product")
        
        # Calculate discount
        discount_amount = 0.0
        if coupon["discount_type"] == "Flat":
            discount_amount = min(coupon["discount_value"], order_value)
        else:  # Percentage
            discount_amount = (order_value * coupon["discount_value"]) / 100
        
        return CouponValidation(
            is_valid=True,
            discount_amount=discount_amount,
            message="Coupon applied successfully"
        )
    
    @staticmethod
    async def record_usage(code: str, user_id: str, rental_id: str, discount_amount: float):
        """
        Record coupon usage
        """
        coupons_collection = db.get_db()["coupons"]
        usage_collection = db.get_db()["coupon_usage"]
        
        coupon = await coupons_collection.find_one({"code": code})
        if not coupon:
            return
        
        # Increment times_used
        await coupons_collection.update_one(
            {"code": code},
            {"$inc": {"times_used": 1}}
        )
        
        # Record usage
        usage_dict = {
            "id": str(uuid4()),
            "coupon_id": coupon["id"],
            "coupon_code": code,
            "user_id": user_id,
            "rental_id": rental_id,
            "discount_amount": discount_amount,
            "used_at": datetime.utcnow()
        }
        
        await usage_collection.insert_one(usage_dict)
    
    @staticmethod
    async def get_coupon_usage(coupon_id: str) -> List[CouponUsage]:
        """
        Get usage history for a coupon
        """
        usage_collection = db.get_db()["coupon_usage"]
        
        cursor = usage_collection.find({"coupon_id": coupon_id}).sort("used_at", -1)
        usage_list = await cursor.to_list(length=100)
        
        return [CouponUsage(**usage) for usage in usage_list]