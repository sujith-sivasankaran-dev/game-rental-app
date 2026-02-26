from pydantic_settings import BaseSettings
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os

class Settings(BaseSettings):
    MONGO_URL: str = "mongodb://localhost:27017"
    DB_NAME: str = "ss_gaming_rentals"
    JWT_SECRET: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    CLOUDINARY_CLOUD_NAME: str = "dfnjtq6m3"
    CLOUDINARY_API_KEY: str = "935992396165584"
    CLOUDINARY_API_SECRET: str = "gCIE5eAdEr1zmo1uxD6CTk3RlkA"
    
    class Config:
        env_file = "../.env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env

settings = Settings()

# MongoDB connection
class Database:
    client: Optional[AsyncIOMotorClient] = None
    
    @classmethod
    async def connect_db(cls):
        cls.client = AsyncIOMotorClient(settings.MONGO_URL)
        print("✅ Connected to MongoDB")
    
    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            print("❌ Closed MongoDB connection")
    
    @classmethod
    def get_db(cls):
        return cls.client[settings.DB_NAME]

db = Database()