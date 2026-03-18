import express from 'express';
import {
  getAllLogs,
  getOrderLogs,
} from '../controllers/logsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/logs - Get all agent logs (Protected)
router.get('/', protect, getAllLogs);

// GET /api/logs/order/:orderId - Get logs for specific order (Protected)
router.get('/order/:orderId', protect, getOrderLogs);

export default router;
