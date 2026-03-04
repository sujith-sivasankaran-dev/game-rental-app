from backend.config import db
from backend.models.rental import RentalCreate, RentalExtension, RentalResponse, RentalInDB, DeliveryAddress
from backend.services.product_service import ProductService
from backend.services.coupon_service import CouponService
from datetime import datetime, timedelta
from uuid import uuid4
from typing import List, Optional

class RentalService:
    @staticmethod
    async def create_rental(user_id: str, rental_data: RentalCreate) -> Optional[RentalResponse]:
        rentals_collection = db.get_db()["rentals"]
        
        # Get product details
        product = await ProductService.get_product(rental_data.product_id)
        if not product or not product.is_active:
            return None
        
        # Calculate end date
        end_date = rental_data.start_date + timedelta(hours=rental_data.rental_duration)
        
        # Check availability
        is_available = await ProductService.check_availability(
            rental_data.product_id,
            rental_data.start_date,
            end_date
        )
        
        if not is_available:
            return None
        
        # Calculate price
        base_price = product.rental_price * (rental_data.rental_duration / 24)  # Daily rate
        discount_amount = 0.0
        
        # Apply coupon if provided
        if rental_data.coupon_code:
            coupon_validation = await CouponService.validate_coupon(
                rental_data.coupon_code,
                user_id,
                rental_data.product_id,
                product.product_type,
                base_price
            )
            if coupon_validation.is_valid:
                discount_amount = coupon_validation.discount_amount
        
        total_price = base_price - discount_amount
        
        # Create rental
        rental_dict = {
            "id": str(uuid4()),
            "user_id": user_id,
            "product_id": rental_data.product_id,
            "start_date": rental_data.start_date,
            "end_date": end_date,
            "extended_end_date": None,
            "status": "active",
            "base_price": base_price,
            "extension_price": 0.0,
            "discount_amount": discount_amount,
            "total_price": total_price,
            "coupon_code": rental_data.coupon_code,
            "delivery_address": rental_data.delivery_address.model_dump() if rental_data.delivery_address else None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await rentals_collection.insert_one(rental_dict)
        
        # Record coupon usage
        if rental_data.coupon_code and discount_amount > 0:
            await CouponService.record_usage(
                rental_data.coupon_code,
                user_id,
                rental_dict["id"],
                discount_amount
            )
        
        # Note: Stock is no longer decremented permanently
        # Availability is calculated dynamically based on overlapping bookings
        
        return await RentalService._format_rental_response(rental_dict)
    
    @staticmethod
    async def extend_rental(rental_id: str, user_id: str, extension_data: RentalExtension) -> Optional[RentalResponse]:
        rentals_collection = db.get_db()["rentals"]
        
        rental = await rentals_collection.find_one({"id": rental_id, "user_id": user_id})
        if not rental or rental["status"] not in ["active", "extended"]:
            return None
        
        # Get product details
        product = await ProductService.get_product(rental["product_id"])
        if not product:
            return None
        
        # Calculate new end date
        current_end = rental.get("extended_end_date") or rental["end_date"]
        new_end_date = current_end + timedelta(hours=extension_data.extension_duration)
        
        # Check availability for extension
        is_available = await ProductService.check_availability(
            rental["product_id"],
            current_end,
            new_end_date
        )
        
        if not is_available:
            return None
        
        # Calculate extension price with multiplier
        extension_price = product.rental_price * (extension_data.extension_duration / 24) * product.extension_multiplier
        
        # Update rental
        update_data = {
            "extended_end_date": new_end_date,
            "status": "extended",
            "extension_price": rental.get("extension_price", 0.0) + extension_price,
            "total_price": rental["total_price"] + extension_price,
            "updated_at": datetime.utcnow()
        }
        
        result = await rentals_collection.find_one_and_update(
            {"id": rental_id},
            {"$set": update_data},
            return_document=True
        )
        
        return await RentalService._format_rental_response(result)
    
    @staticmethod
    async def get_user_rentals(user_id: str, status: Optional[str] = None) -> List[RentalResponse]:
        rentals_collection = db.get_db()["rentals"]
        
        query = {"user_id": user_id}
        if status:
            query["status"] = status
        
        cursor = rentals_collection.find(query).sort("created_at", -1)
        rentals = await cursor.to_list(length=100)
        
        return [await RentalService._format_rental_response(rental) for rental in rentals]
    
    @staticmethod
    async def get_rental(rental_id: str) -> Optional[RentalResponse]:
        rentals_collection = db.get_db()["rentals"]
        rental = await rentals_collection.find_one({"id": rental_id})
        
        if not rental:
            return None
        
        return await RentalService._format_rental_response(rental)
    
    @staticmethod
    async def _format_rental_response(rental: dict) -> RentalResponse:
        product = await ProductService.get_product(rental["product_id"])
        
        # Format delivery address if exists
        delivery_addr = None
        if rental.get("delivery_address"):
            delivery_addr = DeliveryAddress(**rental["delivery_address"])
        
        return RentalResponse(
            id=rental["id"],
            user_id=rental["user_id"],
            product_id=rental["product_id"],
            product_name=product.name if product else "Unknown",
            product_photo=product.photo_url if product else None,
            start_date=rental["start_date"],
            end_date=rental["end_date"],
            extended_end_date=rental.get("extended_end_date"),
            status=rental["status"],
            base_price=rental["base_price"],
            extension_price=rental.get("extension_price", 0.0),
            discount_amount=rental.get("discount_amount", 0.0),
            total_price=rental["total_price"],
            coupon_code=rental.get("coupon_code"),
            delivery_address=delivery_addr,
            created_at=rental["created_at"],
            updated_at=rental["updated_at"]
        )
    
    @staticmethod
    async def complete_rental(rental_id: str) -> bool:
        """
        Mark rental as completed and restore stock
        """
        rentals_collection = db.get_db()["rentals"]
        
        rental = await rentals_collection.find_one({"id": rental_id})
        if not rental:
            return False
        
        await rentals_collection.update_one(
            {"id": rental_id},
            {"$set": {"status": "completed", "updated_at": datetime.utcnow()}}
        )
        
        # Restore stock
        await ProductService.update_stock(rental["product_id"], 1)
        
        return True