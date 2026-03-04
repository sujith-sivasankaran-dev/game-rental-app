from backend.config import db
from backend.models.product import ProductCreate, ProductUpdate, ProductResponse, ProductWithHistory
from datetime import datetime
from uuid import uuid4
from typing import List, Optional

class ProductService:
    @staticmethod
    async def create_product(product_data: ProductCreate) -> ProductResponse:
        products_collection = db.get_db()["products"]
        
        product_dict = {
            "id": str(uuid4()),
            **product_data.model_dump(),
            "available_stock": product_data.total_stock,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await products_collection.insert_one(product_dict)
        
        return ProductResponse(**product_dict)
    
    @staticmethod
    async def get_product(product_id: str) -> Optional[ProductResponse]:
        products_collection = db.get_db()["products"]
        product = await products_collection.find_one({"id": product_id})
        
        if not product:
            return None
        
        return ProductResponse(**product)
    
    @staticmethod
    async def list_products(
        product_type: Optional[str] = None,
        compatibility: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        is_active: bool = True,
        search: Optional[str] = None
    ) -> List[ProductResponse]:
        products_collection = db.get_db()["products"]
        
        query = {}
        if is_active is not None:
            query["is_active"] = is_active
        if product_type:
            query["product_type"] = product_type
        if compatibility:
            query["compatibility"] = compatibility
        if min_price is not None or max_price is not None:
            query["rental_price"] = {}
            if min_price is not None:
                query["rental_price"]["$gte"] = min_price
            if max_price is not None:
                query["rental_price"]["$lte"] = max_price
        if search:
            query["name"] = {"$regex": search, "$options": "i"}
        
        cursor = products_collection.find(query)
        products = await cursor.to_list(length=100)
        
        return [ProductResponse(**product) for product in products]
    
    @staticmethod
    async def update_product(product_id: str, product_data: ProductUpdate) -> Optional[ProductResponse]:
        products_collection = db.get_db()["products"]
        
        update_data = {k: v for k, v in product_data.model_dump(exclude_unset=True).items() if v is not None}
        
        if not update_data:
            return await ProductService.get_product(product_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        # Update total_stock should also update available_stock
        if "total_stock" in update_data:
            product = await products_collection.find_one({"id": product_id})
            if product:
                stock_diff = update_data["total_stock"] - product["total_stock"]
                update_data["available_stock"] = product["available_stock"] + stock_diff
        
        result = await products_collection.find_one_and_update(
            {"id": product_id},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            return None
        
        return ProductResponse(**result)
    
    @staticmethod
    async def delete_product(product_id: str) -> bool:
        products_collection = db.get_db()["products"]
        result = await products_collection.delete_one({"id": product_id})
        return result.deleted_count > 0
    
    @staticmethod
    async def get_product_with_history(product_id: str) -> Optional[ProductWithHistory]:
        products_collection = db.get_db()["products"]
        rentals_collection = db.get_db()["rentals"]
        
        product = await products_collection.find_one({"id": product_id})
        if not product:
            return None
        
        # Get rental history
        cursor = rentals_collection.find({"product_id": product_id}).sort("created_at", -1)
        rental_history = await cursor.to_list(length=50)
        
        return ProductWithHistory(
            **product,
            rental_history=rental_history
        )
    
    @staticmethod
    async def check_availability(product_id: str, start_date: datetime, end_date: datetime, quantity: int = 1) -> bool:
        """
        Check if product is available for the given time period.
        Availability is date-based - counts how many units are booked during the period.
        """
        products_collection = db.get_db()["products"]
        rentals_collection = db.get_db()["rentals"]
        
        product = await products_collection.find_one({"id": product_id})
        if not product or not product.get("is_active", False):
            return False
        
        # Count overlapping rentals (active or extended that overlap with requested period)
        overlapping_rentals = await rentals_collection.count_documents({
            "product_id": product_id,
            "status": {"$in": ["active", "extended"]},
            "$or": [
                # Rental starts before requested end AND ends after requested start
                {
                    "start_date": {"$lt": end_date},
                    "end_date": {"$gt": start_date},
                    "extended_end_date": None
                },
                # For extended rentals, check extended_end_date
                {
                    "start_date": {"$lt": end_date},
                    "extended_end_date": {"$gt": start_date}
                }
            ]
        })
        
        # Available = Total Stock - Units booked during this period
        available = product["total_stock"] - overlapping_rentals
        return available >= quantity
    
    @staticmethod
    async def get_availability_for_dates(product_id: str, start_date: datetime, end_date: datetime) -> dict:
        """
        Get detailed availability info for a product during a date range.
        Returns available quantity and booking details.
        """
        products_collection = db.get_db()["products"]
        rentals_collection = db.get_db()["rentals"]
        
        product = await products_collection.find_one({"id": product_id})
        if not product:
            return {"available": False, "quantity": 0, "total_stock": 0, "message": "Product not found"}
        
        if not product.get("is_active", False):
            return {"available": False, "quantity": 0, "total_stock": product["total_stock"], "message": "Product is not active"}
        
        # Count overlapping rentals
        overlapping_rentals = await rentals_collection.count_documents({
            "product_id": product_id,
            "status": {"$in": ["active", "extended"]},
            "$or": [
                {
                    "start_date": {"$lt": end_date},
                    "end_date": {"$gt": start_date},
                    "extended_end_date": None
                },
                {
                    "start_date": {"$lt": end_date},
                    "extended_end_date": {"$gt": start_date}
                }
            ]
        })
        
        available_quantity = product["total_stock"] - overlapping_rentals
        
        return {
            "available": available_quantity > 0,
            "quantity": max(0, available_quantity),
            "total_stock": product["total_stock"],
            "booked_units": overlapping_rentals,
            "message": "Available" if available_quantity > 0 else "Fully booked for selected dates"
        }
    
    @staticmethod
    async def update_stock(product_id: str, quantity_change: int):
        """
        Update available stock (atomic operation)
        NOTE: This is now deprecated - availability is calculated dynamically based on bookings
        """
        # Keeping this method for backwards compatibility but it's no longer needed
        # as availability is now calculated based on overlapping rentals
        pass