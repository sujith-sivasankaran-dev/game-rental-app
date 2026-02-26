from backend.config import db
from backend.models.user import UserCreate, UserInDB, UserResponse
from backend.utils.jwt_handler import hash_password, verify_password, create_access_token
from datetime import datetime
from uuid import uuid4
from typing import Optional

class AuthService:
    @staticmethod
    async def create_user(user_data: UserCreate, role: str = "customer") -> Optional[UserResponse]:
        users_collection = db.get_db()["users"]
        
        # Check if user exists
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            return None
        
        # Create user
        user_dict = {
            "id": str(uuid4()),
            "email": user_data.email,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "hashed_password": hash_password(user_data.password),
            "role": role,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        
        await users_collection.insert_one(user_dict)
        
        return UserResponse(
            id=user_dict["id"],
            email=user_dict["email"],
            full_name=user_dict["full_name"],
            phone=user_dict["phone"],
            role=user_dict["role"],
            is_active=user_dict["is_active"],
            created_at=user_dict["created_at"]
        )
    
    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[dict]:
        users_collection = db.get_db()["users"]
        user = await users_collection.find_one({"email": email})
        
        if not user:
            return None
        
        if not verify_password(password, user["hashed_password"]):
            return None
        
        if not user.get("is_active", True):
            return None
        
        # Create access token
        access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserResponse(
                id=user["id"],
                email=user["email"],
                full_name=user["full_name"],
                phone=user.get("phone"),
                role=user["role"],
                is_active=user["is_active"],
                created_at=user["created_at"]
            )
        }
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[UserResponse]:
        users_collection = db.get_db()["users"]
        user = await users_collection.find_one({"id": user_id})
        
        if not user:
            return None
        
        return UserResponse(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            phone=user.get("phone"),
            role=user["role"],
            is_active=user["is_active"],
            created_at=user["created_at"]
        )