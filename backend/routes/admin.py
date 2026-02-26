from fastapi import APIRouter, Depends
from backend.routes.auth import get_current_admin
from backend.config import db
from datetime import datetime, timedelta
from typing import Dict, Any

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
    cursor = rentals_collection.find().sort("created_at", -1)
    rentals = await cursor.to_list(100)
    return rentals