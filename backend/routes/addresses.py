from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from backend.models.address import AddressCreate, AddressUpdate, AddressResponse, AddressInDB
from backend.models.user import UserResponse
from backend.routes.auth import get_current_user
from backend.config import db
from datetime import datetime
import uuid

router = APIRouter(prefix="/addresses", tags=["Addresses"])

@router.get("", response_model=List[AddressResponse])
async def get_user_addresses(current_user: UserResponse = Depends(get_current_user)):
    """Get all addresses for the current user"""
    addresses_collection = db.get_db()["addresses"]
    cursor = addresses_collection.find({"user_id": current_user.id}, {"_id": 0})
    addresses = await cursor.to_list(100)
    return addresses

@router.get("/{address_id}", response_model=AddressResponse)
async def get_address(address_id: str, current_user: UserResponse = Depends(get_current_user)):
    """Get a specific address"""
    addresses_collection = db.get_db()["addresses"]
    address = await addresses_collection.find_one(
        {"id": address_id, "user_id": current_user.id}, 
        {"_id": 0}
    )
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    return address

@router.post("", response_model=AddressResponse)
async def create_address(address_data: AddressCreate, current_user: UserResponse = Depends(get_current_user)):
    """Create a new address"""
    addresses_collection = db.get_db()["addresses"]
    
    # Check if this is the first address (make it default)
    existing_count = await addresses_collection.count_documents({"user_id": current_user.id})
    
    address = AddressInDB(
        **address_data.model_dump(),
        user_id=current_user.id,
        is_default=existing_count == 0
    )
    
    await addresses_collection.insert_one(address.model_dump())
    return address

@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: str, 
    address_data: AddressUpdate, 
    current_user: UserResponse = Depends(get_current_user)
):
    """Update an address"""
    addresses_collection = db.get_db()["addresses"]
    
    # Check if address exists and belongs to user
    existing = await addresses_collection.find_one(
        {"id": address_id, "user_id": current_user.id}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in address_data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await addresses_collection.update_one(
        {"id": address_id},
        {"$set": update_data}
    )
    
    updated = await addresses_collection.find_one({"id": address_id}, {"_id": 0})
    return updated

@router.delete("/{address_id}")
async def delete_address(address_id: str, current_user: UserResponse = Depends(get_current_user)):
    """Delete an address"""
    addresses_collection = db.get_db()["addresses"]
    
    # Check if address exists and belongs to user
    existing = await addresses_collection.find_one(
        {"id": address_id, "user_id": current_user["id"]}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Address not found")
    
    await addresses_collection.delete_one({"id": address_id})
    
    # If deleted address was default, make another one default
    if existing.get("is_default"):
        another = await addresses_collection.find_one({"user_id": current_user["id"]})
        if another:
            await addresses_collection.update_one(
                {"id": another["id"]},
                {"$set": {"is_default": True}}
            )
    
    return {"message": "Address deleted successfully"}

@router.post("/{address_id}/set-default")
async def set_default_address(address_id: str, current_user = Depends(get_current_user)):
    """Set an address as default"""
    addresses_collection = db.get_db()["addresses"]
    
    # Check if address exists and belongs to user
    existing = await addresses_collection.find_one(
        {"id": address_id, "user_id": current_user["id"]}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Address not found")
    
    # Remove default from all user's addresses
    await addresses_collection.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"is_default": False}}
    )
    
    # Set this one as default
    await addresses_collection.update_one(
        {"id": address_id},
        {"$set": {"is_default": True}}
    )
    
    return {"message": "Default address updated"}
