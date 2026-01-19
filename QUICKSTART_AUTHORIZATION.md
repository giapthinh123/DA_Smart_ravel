# 🚀 Quick Start - Authorization System

## 📦 Installation

### Backend
```bash
cd backend
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## ⚙️ Configuration

### Backend `.env`
```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
MONGO_URI=mongodb://localhost:27017/DA-smart_travel
```

### MongoDB Setup
```bash
# Start MongoDB
mongod

# Create admin user
mongosh
use DA-smart_travel
db.users.updateOne(
  { email: "admin@test.com" },
  { $set: { role: "admin" } }
)
```

## 🏃 Run Application

```bash
# Terminal 1 - Backend
cd backend
python run.py
# Running on http://localhost:5000

# Terminal 2 - Frontend  
cd frontend
npm run dev
# Running on http://localhost:3000
```

## 🎯 Quick Test

### 1. Backend API
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Save the token from response, then:
TOKEN="your-token-here"

# Access protected endpoint
curl -X GET http://localhost:5000/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Frontend
1. Go to http://localhost:3000
2. Click "Login" 
3. Enter: `test@test.com` / `password123`
4. Try accessing http://localhost:3000/admin (should redirect to unauthorized)

### 3. Test Admin
1. Manually set user role to "admin" in MongoDB
2. Logout and login again
3. Access http://localhost:3000/admin (should work!)

## 📝 Usage Examples

### Backend - Protect Route
```python
from app.models.users import Users
from flask_jwt_extended import jwt_required

@blueprint.route("/admin-only", methods=["GET"])
@jwt_required()
@Users.roles_required("admin")
def admin_only():
    return {"msg": "Admin access granted"}
```

### Frontend - Protect Page
```tsx
import { AuthGuard } from '@/components/auth-guard'

export default function AdminPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminContent />
    </AuthGuard>
  )
}
```

### Frontend - Hide UI Elements
```tsx
import { AdminOnly } from '@/components/role-gate'

function MyComponent() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      <AdminOnly>
        <button>Delete All Users</button>
      </AdminOnly>
    </div>
  )
}
```

## 🔑 Available Roles

- **user**: Default role, basic access
- **manager**: Can view stats and reports
- **admin**: Full access to everything

## 📚 Full Documentation

- **Security Guide**: See `SECURITY_AUTHORIZATION.md`
- **Testing Guide**: See `backend/TESTING.md`

## 🐛 Troubleshooting

**403 Forbidden Error**
- Check if user has correct role in database
- Verify JWT token contains role
- User may need to logout/login after role change

**Can't Access Admin Page**
- Make sure user role is "admin" in MongoDB
- Clear browser localStorage and login again
- Check browser console for errors

**Backend Won't Start**
- Check MongoDB is running
- Verify .env file exists with correct values
- Install all dependencies: `pip install -r requirements.txt`

## ⚡ Quick Commands

```bash
# Check MongoDB for user roles
mongosh DA-smart_travel --eval "db.users.find({}, {email:1, role:1})"

# Make user admin
mongosh DA-smart_travel --eval "db.users.updateOne({email:'user@test.com'}, {\$set:{role:'admin'}})"

# Decode JWT token
echo "TOKEN" | cut -d. -f2 | base64 -d

# Test API with curl
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN" | jq
```

## ✅ Checklist

- [ ] MongoDB running
- [ ] Backend .env configured
- [ ] Backend dependencies installed
- [ ] Backend running on port 5000
- [ ] Frontend dependencies installed  
- [ ] Frontend running on port 3000
- [ ] Test user created
- [ ] Admin user role set in DB
- [ ] Can login and get JWT token
- [ ] Protected routes return 403 for wrong role
- [ ] Admin can access admin endpoints

**Ready to go! 🎉**
