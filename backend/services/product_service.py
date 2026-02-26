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
        Check if product is available for the given time period
        """
        products_collection = db.get_db()["products"]
        rentals_collection = db.get_db()["rentals"]
        
        product = await products_collection.find_one({"id": product_id})
        if not product or not product.get("is_active", False):
            return False
        
        # Count overlapping rentals
        overlapping_rentals = await rentals_collection.count_documents({
            "product_id": product_id,
            "status": {"$in": ["active", "extended"]},
            "$or": [
                {"start_date": {"$lte": end_date}, "end_date": {"$gte": start_date}},
                {"start_date": {"$lte": end_date}, "extended_end_date": {"$gte": start_date}}
            ]
        })
        
        available = product["available_stock"] - overlapping_rentals
        return available >= quantity
    
    @staticmethod
    async def update_stock(product_id: str, quantity_change: int):
        """
        Update available stock (atomic operation)
        """
        products_collection = db.get_db()["products"]
        await products_collection.update_one(
            {"id": product_id},
            {"$inc": {"available_stock": quantity_change}}
        )