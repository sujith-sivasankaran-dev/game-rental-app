from fastapi import APIRouter, Depends, HTTPException, status
from backend.models.rental import RentalCreate, RentalExtension, RentalResponse
from backend.services.rental_service import RentalService
from backend.routes.auth import get_current_user, get_current_admin
from backend.models.user import UserResponse
from typing import List, Optional

router = APIRouter(prefix="/rentals", tags=["Rentals"])

@router.post("", response_model=RentalResponse)
async def create_rental(
    rental_data: RentalCreate,
    current_user: UserResponse = Depends(get_current_user)
):
    rental = await RentalService.create_rental(current_user.id, rental_data)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product not available for the selected time period"
        )
    return rental

@router.get("", response_model=List[RentalResponse])
async def get_my_rentals(
    status: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    return await RentalService.get_user_rentals(current_user.id, status)

@router.get("/{rental_id}", response_model=RentalResponse)
async def get_rental(
    rental_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    rental = await RentalService.get_rental(rental_id)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    
    # Check if user owns this rental or is admin
    if rental.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return rental

@router.post("/{rental_id}/extend", response_model=RentalResponse)
async def extend_rental(
    rental_id: str,
    extension_data: RentalExtension,
    current_user: UserResponse = Depends(get_current_user)
):
    rental = await RentalService.extend_rental(rental_id, current_user.id, extension_data)
    if not rental:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot extend rental - not available or not found"
        )
    return rental

@router.post("/{rental_id}/complete")
async def complete_rental(
    rental_id: str,
    current_admin = Depends(get_current_admin)
):
    success = await RentalService.complete_rental(rental_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Rental not found"
        )
    return {"message": "Rental completed successfully"}