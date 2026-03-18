import express from 'express';
import {
  addMedicine,
  getAllMedicines,
  updateMedicineStock,
  getLowStockMedicines,
} from '../controllers/medicineController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// POST /api/medicines - Add new medicine (Admin/Super Admin only)
router.post('/', protect, authorize('admin', 'super_admin'), addMedicine);

// GET /api/medicines - Get all medicines (Protected)
router.get('/', protect, getAllMedicines);

// GET /api/medicines/low-stock - Get low stock medicines (Protected)
router.get('/low-stock', protect, getLowStockMedicines);

// PUT /api/medicines/:id - Update medicine stock (Admin/Super Admin only)
router.put('/:id', protect, authorize('admin', 'super_admin'), updateMedicineStock);

export default router;
