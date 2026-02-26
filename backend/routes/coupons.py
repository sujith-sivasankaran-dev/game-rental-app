from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.coupon import CouponCreate, CouponUpdate, CouponResponse, CouponValidation, CouponUsage
from backend.services.coupon_service import CouponService
from backend.routes.auth import get_current_admin, get_current_user
from typing import List, Optional

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.post("", response_model=CouponResponse)
async def create_coupon(
    coupon_data: CouponCreate,
    current_admin = Depends(get_current_admin)
):
    return await CouponService.create_coupon(coupon_data)

@router.get("", response_model=List[CouponResponse])
async def list_coupons(
    is_active: Optional[bool] = None,
    current_admin = Depends(get_current_admin)
):
    return await CouponService.list_coupons(is_active)

@router.get("/{coupon_id}", response_model=CouponResponse)
async def get_coupon(
    coupon_id: str,
    current_admin = Depends(get_current_admin)
):
    coupon = await CouponService.get_coupon(coupon_id)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    return coupon

@router.get("/{coupon_id}/usage", response_model=List[CouponUsage])
async def get_coupon_usage(
    coupon_id: str,
    current_admin = Depends(get_current_admin)
):
    return await CouponService.get_coupon_usage(coupon_id)

@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    coupon_data: CouponUpdate,
    current_admin = Depends(get_current_admin)
):
    coupon = await CouponService.update_coupon(coupon_id, coupon_data)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    return coupon

@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: str,
    current_admin = Depends(get_current_admin)
):
    success = await CouponService.delete_coupon(coupon_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    return {"message": "Coupon deleted successfully"}

@router.post("/validate", response_model=CouponValidation)
async def validate_coupon(
    code: str,
    product_id: str,
    product_type: str,
    order_value: float,
    current_user = Depends(get_current_user)
):
    return await CouponService.validate_coupon(
        code,
        current_user.id,
        product_id,
        product_type,
        order_value
    )

@router.get("/code/{code}", response_model=CouponResponse)
async def get_coupon_by_code(
    code: str,
    current_user = Depends(get_current_user)
):
    coupon = await CouponService.get_coupon_by_code(code)
    if not coupon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coupon not found"
        )
    return coupon