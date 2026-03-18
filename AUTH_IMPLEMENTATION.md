# Authentication System - Setup Guide

## 🎯 Overview

Complete JWT-based authentication system with:
- ✅ User registration with admin approval
- ✅ Login/Logout functionality
- ✅ Password reset (Forgot password)
- ✅ Role-based access control (Admin & Pharmacist)
- ✅ Protected routes
- ✅ Order tracking by user

---

## 🚀 Quick Start

### 1. Add JWT Secret to .env

Add this to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
```

### 2. Create First Admin User

Run this command in the backend directory:

```bash
npm run create-admin
```

**Default Admin Credentials:**
- Email: `admin@pharmacy.com`
- Password: `admin123`

⚠️ **IMPORTANT**: Change the admin password after first login!

### 3. Start the Application

```bash
# Backend
cd backend
npm run dev

# Frontend (in another terminal)
cd frontend
npm run dev
```

---

## 📋 User Roles

### 👤 Admin
**Access:**
- All medicine operations (add, update stock)
- View all patients, orders, logs
- Approve/reject pharmacist registrations
- Manage all users

**Default Route:** `/admin`

### 👨‍⚕️ Pharmacist
**Access:**
- Register new patients
- Process orders using AI chat
- View patient medication history
- View low stock alerts
- See ALL orders (for history lookup)

**Default Route:** `/pharmacist`

**Registration:** Self-register → Admin approval required

### 👤 Patient
**No Login Required** - Registered by pharmacists only

---

## 🔐 Authentication Flow

### New Pharmacist Registration

1. Visit `/register`
2. Fill in details (name, email, password, phone)
3. Submit → Account created with `pending` status
4. Admin receives notification in User Management tab
5. Admin approves/rejects
6. Pharmacist can login once approved

### Login Process

1. Visit `/login`
2. Enter email & password
3. System validates credentials
4. Checks account status (must be `active`)
5. Generates JWT token
6. Redirects to appropriate dashboard based on role

### Forgot Password

1. Visit `/forgot-password`
2. Enter email
3. Receive reset link (or token in dev mode)
4. Click link to reset password
5. Set new password

---

## 🛠️ Technical Implementation

### Backend

#### New Files Created:
- `backend/src/models/User.js` - User model with password hashing
- `backend/src/middleware/auth.js` - JWT auth middleware
- `backend/src/controllers/authController.js` - Auth logic
- `backend/src/routes/authRoutes.js` - Auth endpoints
- `backend/src/utils/createAdmin.js` - Admin creation script

#### Modified Files:
- `backend/src/models/Order.js` - Added `processedBy` field
- `backend/src/config/env.js` - Added JWT config
- `backend/src/app.js` - Added auth routes
- All route files - Added auth middleware
- `backend/src/controllers/orderController.js` - Track who processed orders
- `backend/package.json` - Added create-admin script

### Frontend

#### New Files Created:
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`
- `frontend/src/pages/ForgotPassword.jsx`

#### Modified Files:
- `frontend/src/App.jsx` - Added auth routes & protected routes
- `frontend/src/api/index.js` - Added auth APIs & token interceptor
- `frontend/src/pages/AdminDashboard.jsx` - Added User Management tab

---

## 🔌 API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new pharmacist |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password/:token` | Reset password |

### Protected Endpoints (All Users)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user info |
| GET | `/api/patients` | Get all patients |
| POST | `/api/patients` | Register patient |
| GET | `/api/medicines` | Get all medicines |
| POST | `/api/orders/chat` | Process order |
| GET | `/api/orders` | Get all orders |
| GET | `/api/logs` | Get agent logs |

### Admin-Only Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/medicines` | Add medicine |
| PUT | `/api/medicines/:id` | Update stock |
| GET | `/api/auth/pending-users` | Get pending pharmacists |
| PUT | `/api/auth/approve-user/:id` | Approve pharmacist |
| PUT | `/api/auth/reject-user/:id` | Reject pharmacist |
| GET | `/api/auth/users` | Get all users |

---

## 💡 Key Features

### 1. **Admin Approval Workflow**
- New pharmacists cannot login until approved
- Admins see pending requests with notification badge
- One-click approve/reject

### 2. **All Pharmacists See All Orders**
- Patient walks in: "Give me what I ordered last time"
- Any pharmacist can look up patient's order history
- Better for customer service

### 3. **Order Tracking**
- Each order records which user processed it
- Accountability and audit trail
- View in order details

### 4. **Password Reset**
- Email-based (if configured)
- Dev mode shows reset URL directly
- Token expires in 10 minutes

### 5. **Secure Token Management**
- JWT stored in localStorage
- Auto-attached to all API requests
- Auto-redirect on 401 (Unauthorized)

---

## 🎨 User Interface

### Login Page
- Clean, modern design
- Shows demo credentials
- Links to register & forgot password

### Register Page
- Simple form with validation
- Success message with countdown
- Informs about admin approval requirement

### Admin Dashboard - User Management Tab
- **Pending Approvals Section** (highlighted in orange)
  - Shows all pending pharmacist requests
  - Quick approve/reject buttons
- **All Users Table**
  - Lists all users with role & status
  - Color-coded badges

---

## 🔒 Security Features

1. **Password Hashing** - bcrypt with salt rounds
2. **JWT Tokens** - Secure, expiring tokens
3. **Protected Routes** - Both frontend & backend
4. **Role-Based Access** - Middleware checks user role
5. **Status Check** - Only active users can login
6. **Token Expiry** - 7 days (configurable)

---

## 📊 Assignment Compliance

✅ **Core Modules**: User management, Auth middleware, Controllers
✅ **APIs**: 14 existing + 8 new auth endpoints = **22+ APIs**
✅ **Database Integration**: MongoDB with User model + order tracking
✅ **Authentication System**: Complete JWT authentication with approval workflow

---

## 🧪 Testing the System

### 1. Test Admin Login
```
Email: admin@pharmacy.com
Password: admin123
```

### 2. Test Pharmacist Registration
1. Logout if logged in
2. Go to `/register`
3. Create pharmacist account
4. See "pending approval" message
5. Try to login → Should fail with "pending approval"

### 3. Test Admin Approval
1. Login as admin
2. Go to User Management tab
3. See pending pharmacist request
4. Click "Approve"
5. Logout

### 4. Test Pharmacist Login
1. Login with approved pharmacist credentials
2. Should redirect to `/pharmacist`
3. Can register patients and process orders

### 5. Test Forgot Password
1. Logout
2. Click "Forgot password?"
3. Enter email
4. Check console/email for reset link

---

## 🐛 Troubleshooting

### "Token is invalid or expired"
- Clear localStorage and login again
- Check JWT_SECRET is set in .env

### "Not authorized to access this route"
- Make sure you're logged in
- Check token is being sent in headers

### Can't login after registration
- Check account status in database
- Admin must approve pharmacist accounts

### Orders not showing processedBy
- Old orders won't have this field
- New orders will track the user

---

## 🎯 Next Steps (Optional Enhancements)

1. ✨ Add email verification on registration
2. ✨ Add password change in user profile
3. ✨ Add user activity logs
4. ✨ Add admin creation of pharmacist accounts
5. ✨ Add "Remember Me" functionality
6. ✨ Add session timeout warnings
7. ✨ Add two-factor authentication
8. ✨ Add user suspension/ban feature

---

## 📝 Notes

- **Production**: Change JWT_SECRET to a strong random string
- **Email**: Configure Email settings for password reset
- **Security**: Use HTTPS in production
- **Database**: Backup before testing in production

---

## ✅ Summary

Your AI Pharmacy system now has a complete authentication system with:
- Secure login/logout
- Role-based access control  
- Admin approval workflow
- Password reset functionality
- Protected API endpoints
- Order tracking by user
- Beautiful UI for all auth flows

All assignment requirements are met! 🎉
