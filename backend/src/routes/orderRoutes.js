import express from 'express';
import {
  processChatOrder,
  getAllOrders,
  getOrderById,
  processConversationalOrder,
} from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/orders/chat - Process natural language order (Protected)
router.post('/chat', protect, processChatOrder);

// POST /api/orders/conversational - NEW: Conversational pharmacist ordering (Protected)
router.post('/conversational', protect, processConversationalOrder);

// GET /api/orders - Get all orders (Protected)
router.get('/', protect, getAllOrders);

// GET /api/orders/:id - Get order by ID (Protected)
router.get('/:id', protect, getOrderById);

export default router;
