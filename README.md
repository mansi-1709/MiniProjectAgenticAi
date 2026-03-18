# 🏥 Agentic AI Pharmacy Management System

A production-quality pharmacy management system powered by OpenAI Agents, MongoDB Atlas, and modern web technologies.

## 🎯 Features

- **AI-Powered Ordering**: Natural language processing for medicine orders
- **5 Intelligent Agents**: 
  - Ordering Agent: Extracts structured data from natural language
  - Safety Agent: Validates prescriptions and stock
  - Inventory Refill Agent: Monitors stock levels
  - Notification Agent: Alerts for important events
  - Observability Agent: Logs all agent decisions
- **Patient Management**: Register and manage patient records
- **Inventory Management**: Real-time stock tracking and alerts
- **Automated Billing**: Generate and print bills instantly
- **Admin Dashboard**: Complete system oversight
- **MongoDB Atlas**: Cloud-based database
- **Modern UI**: Clean, responsive React interface

## 🛠️ Tech Stack

### Frontend
- React 18 with Vite
- Tailwind CSS
- Axios for API calls
- React Router for navigation

### Backend
- Node.js & Express
- MongoDB Atlas with Mongoose
- OpenAI Agents SDK
- Nodemailer (email notifications)

### AI
- OpenAI GPT-4 for agent reasoning
- Structured outputs for data extraction

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB Atlas Account** (free tier available)
3. **OpenAI API Key** (paid account required)
4. **Git** (for cloning)

## 🚀 Setup Instructions

### Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account or sign in
3. Click **"Build a Database"**
4. Choose **FREE** tier (M0 Sandbox)
5. Select your cloud provider and region
6. Click **"Create Cluster"**
7. Create a database user:
   - Click **"Database Access"** → **"Add New Database User"**
   - Choose **"Password"** authentication
   - Username: `pharmacyAdmin`
   - Generate a secure password (save it!)
   - Set privileges to **"Read and write to any database"**
   - Click **"Add User"**
8. Configure network access:
   - Click **"Network Access"** → **"Add IP Address"**
   - Click **"Allow Access from Anywhere"** (for development)
   - Click **"Confirm"**
9. Get connection string:
   - Go to **"Database"** → Click **"Connect"**
   - Choose **"Connect your application"**
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `myFirstDatabase` with `pharmacyDB`

### Step 2: OpenAI API Key Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Go to **API keys** section
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-proj-...`)
6. **Important**: Add billing information to your OpenAI account

### Step 3: Project Setup

1. **Clone or navigate to the project directory**
   ```bash
   cd a:\MiniProjectAgenticAi
   ```

2. **Create .env file**
   ```bash
   cp .env.example .env
   ```

3. **Edit .env file** with your credentials:
   - Add your MongoDB connection string to `MONGO_URI`
   - Add your OpenAI API key to `OPENAI_API_KEY`
   - (Optional) Configure email settings

### Step 4: Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend server will start on `http://localhost:5000`

### Step 5: Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 6: Seed Sample Data (Optional)

In another terminal:

```bash
cd backend
npm run seed
```

This will populate sample medicines and patients.

## 📱 Usage Guide

### For Pharmacists

1. **Access Dashboard**: Navigate to `http://localhost:5173`
2. **Register Patient**: Fill in patient details (name, phone, age)
3. **Search Patient**: Use phone number to find existing patients
4. **Place Order**: Type natural language in chat:
   - "Give 10 Paracetamol to patient"
   - "I need 5 Aspirin tablets"
   - "Provide 20 Amoxicillin capsules"
5. **Review Response**: AI agents process and respond with order status
6. **View Bill**: If approved, bill is displayed
7. **Print Bill**: Click "Print Bill" button

### For Admins

1. **Access Admin Dashboard**: Click "Admin Dashboard" in navigation
2. **Manage Medicines**: Add new medicines with stock, price, thresholds
3. **Update Inventory**: Modify stock quantities
4. **View Orders**: See complete order history
5. **Monitor Logs**: View all agent decisions and reasoning
6. **Check Alerts**: See low stock notifications

## 🤖 AI Agents Workflow

```
User Input (Natural Language)
         ↓
   Ordering Agent ────→ Extract: {medicine, quantity}
         ↓
   Safety Agent ──────→ Validate: stock, prescription, rules
         ↓
   [Approved] ────────→ Update Inventory + Create Order
         ↓
   Billing Service ───→ Calculate total + Generate bill
         ↓
   Inventory Agent ───→ Check stock threshold
         ↓
   Notification Agent → Send alerts (low stock, etc.)
         ↓
   Observability Agent → Log all decisions
         ↓
   Response to User
```

## 📊 API Endpoints

### Patients
- `POST /api/patients` - Register new patient
- `GET /api/patients` - Get all patients
- `GET /api/patients/phone/:phone` - Find by phone

### Medicines
- `POST /api/medicines` - Add new medicine
- `GET /api/medicines` - Get all medicines
- `PUT /api/medicines/:id` - Update medicine stock

### Orders
- `POST /api/orders/chat` - Process natural language order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get specific order

### Logs
- `GET /api/logs` - Get all agent logs
- `GET /api/logs/order/:orderId` - Get logs for specific order

## 🎨 UI Features

- **Responsive Design**: Works on desktop and tablet
- **Real-time Updates**: Instant feedback on actions
- **Loading States**: Clear indicators during processing
- **Error Handling**: User-friendly error messages
- **Print-Ready Bills**: Professional invoice layout
- **Stock Alerts**: Visual warnings for low inventory

## 🔒 Security Best Practices

1. Never commit `.env` file
2. Use environment-specific configurations
3. Implement authentication (extend with JWT)
4. Sanitize all user inputs
5. Use HTTPS in production
6. Rotate API keys regularly

## 🚀 Production Deployment

### Backend (Render, Railway, or Heroku)
1. Push code to GitHub
2. Connect repository to hosting service
3. Set environment variables in dashboard
4. Deploy

### Frontend (Vercel or Netlify)
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Deploy

## 📝 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB Atlas connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `PORT` | Backend server port | No (default: 5000) |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: localhost:5173) |
| `EMAIL_HOST` | SMTP server | No |
| `EMAIL_PORT` | SMTP port | No |
| `EMAIL_USER` | Email username | No |
| `EMAIL_PASS` | Email password | No |
| `WEBHOOK_URL` | Notification webhook | No |

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### MongoDB Connection Issues
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Ensure password doesn't contain special characters (URL encode if needed)

### OpenAI API Errors
- Verify API key is correct
- Check billing is set up on OpenAI account
- Ensure sufficient credits

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Change port in .env file
```

## 📞 Support

For issues or questions:
- Create an issue on GitHub
- Check documentation
- Review API logs

---

Built with ❤️ using AI Agents, React, and MongoDB Atlas
