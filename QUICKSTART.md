# 🚀 Quick Start Guide

Get your AI Pharmacy Management System running in 5 minutes!

## Prerequisites Check
- ✅ Node.js v18+ installed
- ✅ MongoDB Atlas account created
- ✅ OpenAI API key obtained

## Step-by-Step Setup

### 1. Configure Environment Variables

Create `.env` file in the project root:

```bash
# Navigate to project directory
cd a:\MiniProjectAgenticAi

# Copy the example file
copy .env.example .env
```

Now edit `.env` with your credentials:

```env
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/pharmacyDB?retryWrites=true&w=majority
OPENAI_API_KEY=sk-proj-YOUR_OPENAI_API_KEY_HERE
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Need help?**
- MongoDB: See [MONGODB_SETUP.md](./MONGODB_SETUP.md)
- OpenAI: See [OPENAI_SETUP.md](./OPENAI_SETUP.md)

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Seed Sample Data (Optional but Recommended)

```bash
npm run seed
```

This adds:
- 10 sample medicines
- 5 sample patients

### 4. Start Backend Server

```bash
npm run dev
```

✅ You should see:
```
✅ MongoDB Connected: cluster0-xxxxx.mongodb.net
🚀 Server running on port 5000
✨ AI Agents loaded and ready!
```

### 5. Install Frontend Dependencies

Open a **NEW terminal** window:

```bash
cd a:\MiniProjectAgenticAi\frontend
npm install
```

### 6. Start Frontend

```bash
npm run dev
```

✅ You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 7. Open Application

Open your browser and navigate to:
```
http://localhost:5173
```

## 🎉 You're Ready!

### Test the System

1. **Register a Patient**
   - Click "Register New Patient"
   - Name: John Doe
   - Phone: 1234567890
   - Age: 35
   - Click "Register"

2. **Search & Select Patient**
   - Enter phone: 1234567890
   - Click search 🔍
   - Patient should appear as selected

3. **Place an Order**
   - In the chat box, type:
     ```
     Give 10 Paracetamol to patient
     ```
   - Click "Process Order"
   - Wait for AI agents to process (5-10 seconds)

4. **View Results**
   - Order approved ✅
   - Bill displayed
   - Stock updated
   - Logs recorded

5. **Try Admin Dashboard**
   - Click "Admin Dashboard" in navigation
   - View medicines, patients, orders, and agent logs

## Common Commands

### Backend
```bash
cd backend
npm run dev          # Start development server
npm run seed         # Seed sample data
npm start            # Production start
```

### Frontend
```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Both (from root)
```bash
npm run install-all  # Install all dependencies
npm run backend      # Start backend only
npm run frontend     # Start frontend only
```

## Troubleshooting

### Port Already in Use
```bash
# Windows - Kill process on port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### MongoDB Connection Failed
1. Check IP whitelist (0.0.0.0/0)
2. Verify username/password
3. Check connection string format

### OpenAI API Error
1. Verify API key is correct
2. Check billing is set up
3. Ensure sufficient credits

### Frontend Can't Connect
1. Make sure backend is running
2. Check port 5000 is accessible
3. Verify CORS settings

## Next Steps

- 📖 Read [README.md](./README.md) for detailed documentation
- 🔒 Set up authentication (extend the system)
- 🚀 Deploy to production (Render, Vercel, etc.)
- 📊 Add analytics and reporting
- 🔔 Configure real email notifications

## Need Help?

Check the detailed setup guides:
- [MongoDB Setup](./MONGODB_SETUP.md)
- [OpenAI Setup](./OPENAI_SETUP.md)
- [Main Documentation](./README.md)

---

Happy coding! 🎉
