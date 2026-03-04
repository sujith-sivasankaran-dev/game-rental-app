from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from backend.models.product import ProductCreate, ProductUpdate, ProductResponse, ProductWithHistory
from backend.services.product_service import ProductService
from backend.routes.auth import get_current_admin, get_current_user
from backend.utils.cloudinary_helper import upload_image
from typing import List, Optional
from datetime import datetime
import json

router = APIRouter(prefix="/products", tags=["Products"])

@router.post("", response_model=ProductResponse)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    product_type: str = Form(...),
    compatibility: str = Form(...),
    rental_price: float = Form(...),
    min_rental_period: int = Form(...),
    min_rental_unit: str = Form("Day"),
    extension_rule: str = Form("Full Day Only"),
    extension_multiplier: float = Form(1.0),
    total_stock: int = Form(...),
    is_active: bool = Form(True),
    photo: Optional[UploadFile] = File(None),
    current_admin = Depends(get_current_admin)
):
    photo_url = None
    if photo:
        content = await photo.read()
        photo_url = upload_image(content, f"product_{name.replace(' ', '_')}")
    
    product_data = ProductCreate(
        name=name,
        description=description,
        product_type=product_type,
        compatibility=compatibility,
        rental_price=rental_price,
        min_rental_period=min_rental_period,
        min_rental_unit=min_rental_unit,
        extension_rule=extension_rule,
        extension_multiplier=extension_multiplier,
        total_stock=total_stock,
        is_active=is_active,
        photo_url=photo_url
    )
    
    return await ProductService.create_product(product_data)

@router.get("", response_model=List[ProductResponse])
async def list_products(
    product_type: Optional[str] = None,
    compatibility: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = True
):
    return await ProductService.list_products(
        product_type=product_type,
        compatibility=compatibility,
        min_price=min_price,
        max_price=max_price,
        is_active=is_active,
        search=search
    )

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await ProductService.get_product(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.get("/{product_id}/history", response_model=ProductWithHistory)
async def get_product_history(
    product_id: str,
    current_admin = Depends(get_current_admin)
):
    product = await ProductService.get_product_with_history(product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    name: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    product_type: Optional[str] = Form(None),
    compatibility: Optional[str] = Form(None),
    rental_price: Optional[float] = Form(None),
    min_rental_period: Optional[int] = Form(None),
    min_rental_unit: Optional[str] = Form(None),
    extension_rule: Optional[str] = Form(None),
    extension_multiplier: Optional[float] = Form(None),
    total_stock: Optional[int] = Form(None),
    is_active: Optional[bool] = Form(None),
    photo: Optional[UploadFile] = File(None),
    current_admin = Depends(get_current_admin)
):
    update_data = {}
    if name: update_data["name"] = name
    if description: update_data["description"] = description
    if product_type: update_data["product_type"] = product_type
    if compatibility: update_data["compatibility"] = compatibility
    if rental_price: update_data["rental_price"] = rental_price
    if min_rental_period: update_data["min_rental_period"] = min_rental_period
    if min_rental_unit: update_data["min_rental_unit"] = min_rental_unit
    if extension_rule: update_data["extension_rule"] = extension_rule
    if extension_multiplier: update_data["extension_multiplier"] = extension_multiplier
    if total_stock is not None: update_data["total_stock"] = total_stock
    if is_active is not None: update_data["is_active"] = is_active
    
    if photo:
        content = await photo.read()
        photo_url = upload_image(content, f"product_{product_id}")
        update_data["photo_url"] = photo_url
    
    product_update = ProductUpdate(**update_data)
    product = await ProductService.update_product(product_id, product_update)
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return product

@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    current_admin = Depends(get_current_admin)
):
    success = await ProductService.delete_product(product_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    return {"message": "Product deleted successfully"}