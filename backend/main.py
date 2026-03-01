from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.config import db, settings
from backend.routes import auth, products, rentals, coupons, admin, addresses
import uvicorn

app = FastAPI(
    title="SS Gaming Rentals API",
    description="Backend API for console rental business",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup and Shutdown Events
@app.on_event("startup")
async def startup_event():
    await db.connect_db()
    
    # Create default admin user if not exists
    from backend.services.auth_service import AuthService
    from backend.models.user import UserCreate
    
    admin_email = "admin@ssgaming.com"
    admin_user = await db.get_db()["users"].find_one({"email": admin_email})
    
    if not admin_user:
        admin_data = UserCreate(
            email=admin_email,
            password="admin123",
            full_name="Admin User",
            phone="1234567890"
        )
        await AuthService.create_user(admin_data, role="admin")
        print("✅ Default admin user created: admin@ssgaming.com / admin123")

@app.on_event("shutdown")
async def shutdown_event():
    await db.close_db()

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(rentals.router, prefix="/api")
app.include_router(coupons.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

# Root Endpoint
@app.get("/")
async def root():
    return {
        "message": "SS Gaming Rentals API",
        "version": "1.0.0",
        "status": "running"
    }

# Health Check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)