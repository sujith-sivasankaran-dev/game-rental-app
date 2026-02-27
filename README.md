# SS Gaming Rentals - Console Rental Platform

A modern, full-stack web application for renting gaming consoles, accessories, and games built with **FastAPI** (backend) and **Next.js** (frontend).

## 🎮 Features

### Customer Portal
- Browse and search gaming products
- Filter by type, compatibility, and price
- Real-time availability checking
- Rental booking system with coupon support
- Rental extension functionality
- View rental history and active rentals
- User account management

### Admin Dashboard
- **Metrics Overview:**
  - Total Revenue
  - Active Rentals
  - Total Products
  - Total Customers
  
- **Product Management:**
  - Add/Edit/Delete products
  - Upload product images to Cloudinary
  - Set rental prices and minimum periods
  - Configure extension rules and multipliers
  - Track stock availability
  - View rental history per product

- **Coupon Management:**
  - Create discount coupons (Flat/Percentage)
  - Set applicability (All/Product Type/Specific Product)
  - Configure usage limits
  - Track coupon usage history
  - Set expiry dates and minimum order values

- **Alerts:**
  - Low stock notifications
  - Upcoming returns (next 3 days)
  - Most rented product tracking

## 🏗️ Technology Stack

### Backend
- **Framework:** FastAPI 0.115.0
- **Database:** MongoDB (Motor async driver)
- **Authentication:** JWT (python-jose)
- **Password Hashing:** Bcrypt (passlib)
- **File Upload:** Cloudinary
- **Validation:** Pydantic

### Frontend
- **Framework:** Next.js 14.2.3
- **Styling:** Tailwind CSS + shadcn/ui
- **Theme:** Dark gaming theme (black, neon blue, purple)
- **Icons:** Lucide React
- **Notifications:** Sonner

## 📦 Project Structure

```
/app/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Settings and DB connection
│   ├── models/                 # Pydantic models
│   │   ├── user.py
│   │   ├── product.py
│   │   ├── rental.py
│   │   └── coupon.py
│   ├── routes/                 # API endpoints
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── rentals.py
│   │   ├── coupons.py
│   │   └── admin.py
│   ├── services/               # Business logic
│   │   ├── auth_service.py
│   │   ├── product_service.py
│   │   ├── rental_service.py
│   │   └── coupon_service.py
│   ├── utils/                  # Helpers
│   │   ├── jwt_handler.py
│   │   └── cloudinary_helper.py
│   └── requirements.txt
├── app/                        # Next.js frontend
│   ├── page.js                 # Product listing
│   ├── layout.js               # Main layout
│   ├── login/page.js           # Login page
│   ├── register/page.js        # Registration page
│   ├── admin/                  # Admin pages
│   │   ├── page.js             # Dashboard
│   │   ├── products/page.js    # Product management
│   │   └── coupons/page.js     # Coupon management
│   ├── account/page.js         # Customer account
│   ├── book/[id]/page.js       # Booking page
│   └── components/             # Reusable components
└── .env                        # Environment variables
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- Cloudinary account

### Environment Variables

The `.env` file is already configured with:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=ss_gaming_rentals
NEXT_PUBLIC_BASE_URL=https://game-console-mgmt.preview.emergentagent.com
NEXT_PUBLIC_API_URL=http://localhost:8000/api
CORS_ORIGINS=*

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dfnjtq6m3
CLOUDINARY_API_KEY=235337481634764
CLOUDINARY_API_SECRET=QF6PqnIZ-aBgLR4MJZNUtycL5dI
```

### Running the Application

Both services are managed by **Supervisor** and start automatically:

```bash
# Check service status
sudo supervisorctl status

# Restart services
sudo supervisorctl restart all

# Restart individual services
sudo supervisorctl restart fastapi
sudo supervisorctl restart nextjs
```

**Services:**
- **FastAPI Backend:** http://localhost:8000
- **Next.js Frontend:** http://localhost:3000

### Default Admin Credentials

```
Email: admin@ssgaming.com
Password: admin123
```

## 📚 API Documentation

Once FastAPI is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Products
- `GET /api/products` - List products (with filters)
- `POST /api/products` - Create product (admin)
- `GET /api/products/{id}` - Get product details
- `PUT /api/products/{id}` - Update product (admin)
- `DELETE /api/products/{id}` - Delete product (admin)

#### Rentals
- `POST /api/rentals` - Create rental booking
- `GET /api/rentals` - Get user's rentals
- `POST /api/rentals/{id}/extend` - Extend rental
- `POST /api/rentals/{id}/complete` - Complete rental (admin)

#### Coupons
- `POST /api/coupons` - Create coupon (admin)
- `GET /api/coupons` - List coupons (admin)
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/coupons/{id}/usage` - Get usage history (admin)

#### Admin
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/users` - List all users
- `GET /api/admin/rentals` - List all rentals

## 🎨 UI Theme

The application features a **dark gaming theme** with:
- Primary: Purple (#8B5CF6)
- Secondary: Blue (#3B82F6)
- Accent: Pink/Cyan
- Background: Black with gradient overlays
- Glowing effects on buttons and cards
- Smooth transitions and hover effects

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin/Customer)
- Protected API routes
- Input validation with Pydantic
- CORS configuration

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ssgaming.com","password":"admin123"}'

# List products
curl http://localhost:8000/api/products
```

### Test Frontend
Visit http://localhost:3000 and:
1. Browse products
2. Register a new account
3. Login and book a rental
4. Access admin dashboard with admin credentials

## 🎯 Core Business Logic

### Rental Availability System
- Real-time stock checking
- Prevents double-booking beyond stock quantity
- Checks overlapping rental periods
- Atomic stock operations

### Rental Extension Logic
- Respects minimum extension rules
- Applies extension pricing multiplier
- Prevents extension if product reserved after return date
- Calculates additional costs

### Coupon Validation
- Checks expiry date
- Validates usage limits (total and per-user)
- Verifies minimum order value
- Checks product applicability
- Handles restricted users
- Calculates discounts (flat/percentage)

### Stock Management
- Deducts stock on rental creation
- Restores stock on rental completion
- Tracks available vs total stock
- Low stock alerts (< 2 items)

## 📝 Database Collections

### users
- User authentication and profile data
- Role-based access (admin/customer)

### products
- Product catalog with images
- Rental pricing and rules
- Stock management

### rentals
- Booking records
- Extension tracking
- Pricing history

### coupons
- Discount codes
- Usage rules and limits

### coupon_usage
- Usage history
- Discount tracking

## 🚧 Future Enhancements

- Payment integration (Stripe/PayPal)
- Email notifications
- Advanced analytics and reporting
- Product reviews and ratings
- Mobile app
- Multi-language support

## 📄 License

Copyright © 2025 SS Gaming Rentals. All rights reserved.

## 🤝 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ for gamers by gamers**
