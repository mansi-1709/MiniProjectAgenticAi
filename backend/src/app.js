import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import logsRoutes from './routes/logsRoutes.js';
import inventoryAgentRoutes from './routes/inventoryAgentRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost origin in development (handles port changes)
    if (!origin || origin.startsWith('http://localhost') || origin === config.frontendUrl) {
      return callback(null, true);
    }
    // In production, only allow the configured frontend URL
    if (config.nodeEnv === 'production' && origin !== config.frontendUrl) {
      return callback(new Error('Not allowed by CORS'));
    }
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AI Pharmacy Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/inventory-agent', inventoryAgentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: config.nodeEnv === 'development' ? err : {},
  });
});

export default app;
