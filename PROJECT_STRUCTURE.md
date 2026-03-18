# 📁 Project Structure

Complete file structure of the AI Pharmacy Management System:

```
MiniProjectAgenticAi/
│
├── 📄 .env                          # Environment variables (YOU NEED TO CONFIGURE THIS!)
├── 📄 .env.example                  # Template for environment variables
├── 📄 .gitignore                    # Git ignore rules
├── 📄 package.json                  # Root package.json
├── 📄 README.md                     # Main documentation
├── 📄 QUICKSTART.md                 # Quick start guide
├── 📄 MONGODB_SETUP.md              # MongoDB Atlas setup guide
├── 📄 OPENAI_SETUP.md               # OpenAI API setup guide
├── 📄 PROJECT_STRUCTURE.md          # This file
│
├── 📂 backend/                      # Backend Node.js/Express application
│   ├── 📄 package.json              # Backend dependencies
│   │
│   └── 📂 src/
│       ├── 📄 app.js                # Express app configuration
│       ├── 📄 server.js             # Server entry point
│       │
│       ├── 📂 config/               # Configuration files
│       │   ├── 📄 env.js            # Environment variable handling
│       │   └── 📄 database.js       # MongoDB connection
│       │
│       ├── 📂 models/               # Mongoose models
│       │   ├── 📄 Patient.js        # Patient schema
│       │   ├── 📄 Medicine.js       # Medicine schema
│       │   ├── 📄 Prescription.js   # Prescription schema
│       │   ├── 📄 Order.js          # Order schema
│       │   └── 📄 AgentLog.js       # Agent log schema
│       │
│       ├── 📂 agents/               # AI Agents (OpenAI powered)
│       │   ├── 📄 OrderingAgent.js         # Extract order from NL
│       │   ├── 📄 SafetyAgent.js           # Validate order safety
│       │   ├── 📄 InventoryRefillAgent.js  # Monitor stock levels
│       │   ├── 📄 NotificationAgent.js     # Send alerts
│       │   ├── 📄 ObservabilityAgent.js    # Log agent decisions
│       │   └── 📄 index.js                 # Agent registry
│       │
│       ├── 📂 services/             # Business logic services
│       │   └── 📄 billingService.js # Bill calculation & generation
│       │
│       ├── 📂 controllers/          # Route controllers
│       │   ├── 📄 patientController.js   # Patient CRUD operations
│       │   ├── 📄 medicineController.js  # Medicine CRUD operations
│       │   ├── 📄 orderController.js     # Order processing & orchestration
│       │   └── 📄 logsController.js      # Agent logs retrieval
│       │
│       ├── 📂 routes/               # API routes
│       │   ├── 📄 patientRoutes.js  # /api/patients routes
│       │   ├── 📄 medicineRoutes.js # /api/medicines routes
│       │   ├── 📄 orderRoutes.js    # /api/orders routes
│       │   └── 📄 logsRoutes.js     # /api/logs routes
│       │
│       └── 📂 utils/                # Utility scripts
│           └── 📄 seedData.js       # Database seeding script
│
└── 📂 frontend/                     # Frontend React/Vite application
    ├── 📄 package.json              # Frontend dependencies
    ├── 📄 vite.config.js            # Vite configuration
    ├── 📄 tailwind.config.js        # Tailwind CSS configuration
    ├── 📄 postcss.config.js         # PostCSS configuration
    ├── 📄 index.html                # HTML entry point
    │
    └── 📂 src/
        ├── 📄 main.jsx              # React entry point
        ├── 📄 App.jsx               # Main app component with routing
        ├── 📄 index.css             # Global styles & Tailwind
        │
        ├── 📂 api/                  # API client
        │   └── 📄 index.js          # Axios instance & API methods
        │
        └── 📂 pages/                # Page components
            ├── 📄 PharmacistDashboard.jsx  # Pharmacist interface
            └── 📄 AdminDashboard.jsx       # Admin interface
```

## 📊 Component Breakdown

### Backend Components

#### Models (MongoDB Collections)
- **Patient**: Patient records (name, phone, age)
- **Medicine**: Medicine inventory (name, price, stock, threshold)
- **Prescription**: Patient prescriptions
- **Order**: Order history with items and billing
- **AgentLog**: AI agent execution logs

#### AI Agents
1. **OrderingAgent**: Extracts structured data from natural language
2. **SafetyAgent**: Validates stock, prescriptions, and safety rules
3. **InventoryRefillAgent**: Monitors stock and generates refill alerts
4. **NotificationAgent**: Sends email/webhook notifications
5. **ObservabilityAgent**: Logs all agent decisions for traceability

#### API Routes
- `POST /api/patients` - Register patient
- `GET /api/patients` - Get all patients
- `GET /api/patients/phone/:phone` - Search by phone
- `POST /api/medicines` - Add medicine
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/low-stock` - Get low stock items
- `PUT /api/medicines/:id` - Update stock
- `POST /api/orders/chat` - Process natural language order
- `GET /api/orders` - Get all orders
- `GET /api/logs` - Get all agent logs

### Frontend Components

#### Pages
- **PharmacistDashboard**: 
  - Patient registration
  - Patient search
  - AI chat interface
  - Bill display & printing
  - Low stock alerts
  
- **AdminDashboard**:
  - Medicine management
  - Patient list
  - Order history
  - Agent execution logs

## 🔄 Data Flow

```
User Input (Natural Language)
         ↓
Frontend (React) → POST /api/orders/chat
         ↓
OrderingAgent → Extract: {medicine, quantity}
         ↓
SafetyAgent → Validate: stock, prescription, rules
         ↓
[If Approved]
         ↓
Update Inventory (MongoDB)
         ↓
BillingService → Calculate total
         ↓
Create Order (MongoDB)
         ↓
InventoryRefillAgent → Check stock threshold
         ↓
NotificationAgent → Send alerts
         ↓
ObservabilityAgent → Log all decisions
         ↓
Response → Frontend
         ↓
Display Bill & Status
```

## 📦 Dependencies

### Backend
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `openai` - OpenAI API client
- `nodemailer` - Email sending
- `axios` - HTTP client

### Frontend
- `react` - UI library
- `react-dom` - React DOM renderer
- `react-router-dom` - Routing
- `axios` - API client
- `vite` - Build tool
- `tailwindcss` - CSS framework

## 🚀 Getting Started

1. **Configure .env** - Add MongoDB URI and OpenAI API key
2. **Install backend** - `cd backend && npm install`
3. **Seed data** - `npm run seed`
4. **Start backend** - `npm run dev`
5. **Install frontend** - `cd frontend && npm install`
6. **Start frontend** - `npm run dev`
7. **Open browser** - http://localhost:5173

## 📚 Documentation Files

- **README.md** - Complete project documentation
- **QUICKSTART.md** - 5-minute setup guide
- **MONGODB_SETUP.md** - MongoDB Atlas configuration
- **OPENAI_SETUP.md** - OpenAI API setup
- **PROJECT_STRUCTURE.md** - This file

---

For detailed setup instructions, see [QUICKSTART.md](./QUICKSTART.md)
