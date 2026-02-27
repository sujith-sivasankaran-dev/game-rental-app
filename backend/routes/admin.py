from fastapi import APIRouter, Depends, Query
from backend.routes.auth import get_current_admin
from backend.config import db
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard")
async def get_dashboard_metrics(current_admin = Depends(get_current_admin)) -> Dict[str, Any]:
    database = db.get_db()
    
    # Get collections
    rentals_collection = database["rentals"]
    products_collection = database["products"]
    users_collection = database["users"]
    
    # Total Revenue (from all rentals)
    pipeline = [
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}}
    ]
    revenue_result = await rentals_collection.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Active Rentals
    active_rentals = await rentals_collection.count_documents({
        "status": {"$in": ["active", "extended"]}
    })
    
    # Total Products
    total_products = await products_collection.count_documents({})
    
    # Total Customers
    total_customers = await users_collection.count_documents({"role": "customer"})
    
    # Upcoming Returns (next 3 days)
    three_days_later = datetime.utcnow() + timedelta(days=3)
    upcoming_returns_cursor = rentals_collection.find({
        "status": {"$in": ["active", "extended"]},
        "$or": [
            {"extended_end_date": {"$lte": three_days_later, "$gte": datetime.utcnow()}},
            {"end_date": {"$lte": three_days_later, "$gte": datetime.utcnow()}, "extended_end_date": None}
        ]
    }, {"_id": 0})
    upcoming_returns = await upcoming_returns_cursor.to_list(100)
    
    # Low Stock Alerts (stock < 2)
    low_stock_cursor = products_collection.find({
        "available_stock": {"$lt": 2},
        "is_active": True
    }, {"_id": 0})
    low_stock_products = await low_stock_cursor.to_list(100)
    
    # Most Rented Product
    most_rented_pipeline = [
        {"$group": {"_id": "$product_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 1}
    ]
    most_rented_result = await rentals_collection.aggregate(most_rented_pipeline).to_list(1)
    
    most_rented_product = None
    if most_rented_result:
        product = await products_collection.find_one({"id": most_rented_result[0]["_id"]})
        if product:
            most_rented_product = {
                "name": product["name"],
                "rental_count": most_rented_result[0]["count"]
            }
    
    # Recent rentals for chart/table
    recent_rentals_cursor = rentals_collection.find({}, {"_id": 0}).sort("created_at", -1).limit(10)
    recent_rentals = await recent_rentals_cursor.to_list(10)
    
    return {
        "total_revenue": round(total_revenue, 2),
        "active_rentals": active_rentals,
        "total_products": total_products,
        "total_customers": total_customers,
        "upcoming_returns": upcoming_returns,
        "low_stock_alerts": low_stock_products,
        "most_rented_product": most_rented_product,
        "recent_rentals": recent_rentals
    }

@router.get("/users")
async def list_all_users(current_admin = Depends(get_current_admin)):
    users_collection = db.get_db()["users"]
    cursor = users_collection.find({}, {"hashed_password": 0, "_id": 0}).sort("created_at", -1)
    users = await cursor.to_list(100)
    return users

@router.get("/rentals")
async def list_all_rentals(current_admin = Depends(get_current_admin)):
    rentals_collection = db.get_db()["rentals"]
    cursor = rentals_collection.find({}, {"_id": 0}).sort("created_at", -1)
    rentals = await cursor.to_list(100)
    return rentals

@router.get("/rentals/filtered")
async def get_filtered_rentals(
    current_admin = Depends(get_current_admin),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    product_id: Optional[str] = Query(None, description="Filter by product ID"),
    category: Optional[str] = Query(None, description="Filter by product category"),
    status: Optional[str] = Query(None, description="Filter by rental status")
) -> Dict[str, Any]:
    """Get filtered rental orders with product details"""
    database = db.get_db()
    rentals_collection = database["rentals"]
    products_collection = database["products"]
    users_collection = database["users"]
    
    # Build query filter
    query = {}
    
    # Date range filter - filter by rental creation date
    if date_from or date_to:
        date_filter = {}
        if date_from:
            try:
                from_date = datetime.strptime(date_from, "%Y-%m-%d")
                date_filter["$gte"] = from_date
            except ValueError:
                pass
        if date_to:
            try:
                to_date = datetime.strptime(date_to, "%Y-%m-%d")
                # Include the entire end day
                to_date = to_date.replace(hour=23, minute=59, second=59)
                date_filter["$lte"] = to_date
            except ValueError:
                pass
        if date_filter:
            query["created_at"] = date_filter
    
    # Status filter
    if status and status != "all":
        query["status"] = status
    
    # Get all matching rentals
    cursor = rentals_collection.find(query, {"_id": 0}).sort("created_at", -1)
    rentals = await cursor.to_list(500)
    
    # Get all products for filtering by category and enriching data
    products = {}
    products_cursor = products_collection.find({}, {"_id": 0})
    async for product in products_cursor:
        products[product["id"]] = product
    
    # Get all users for customer details
    users = {}
    users_cursor = users_collection.find({}, {"_id": 0, "hashed_password": 0})
    async for user in users_cursor:
        users[user["id"]] = user
    
    # Filter by product_id and/or category, and enrich with product/user details
    enriched_rentals = []
    for rental in rentals:
        product = products.get(rental.get("product_id"))
        user = users.get(rental.get("user_id"))
        
        # Filter by product_id if specified
        if product_id and rental.get("product_id") != product_id:
            continue
        
        # Filter by category if specified
        if category and category != "all":
            if not product or product.get("product_type") != category:
                continue
        
        # Enrich rental with product and user details
        enriched_rental = {
            **rental,
            "product_name": product.get("name") if product else "Unknown Product",
            "product_type": product.get("product_type") if product else "Unknown",
            "product_photo": product.get("photo_url") if product else None,
            "compatibility": product.get("compatibility") if product else "Unknown",
            "customer_name": user.get("full_name") if user else "Unknown Customer",
            "customer_email": user.get("email") if user else "Unknown"
        }
        enriched_rentals.append(enriched_rental)
    
    # Get unique categories for filter options
    categories = list(set(p.get("product_type") for p in products.values() if p.get("product_type")))
    
    # Get products list for filter dropdown
    products_list = [{"id": p["id"], "name": p["name"]} for p in products.values()]
    
    return {
        "rentals": enriched_rentals,
        "total_count": len(enriched_rentals),
        "categories": categories,
        "products": products_list
    }