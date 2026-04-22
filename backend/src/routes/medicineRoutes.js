import express from 'express';
import {
  addMedicine,
  getAllMedicines,
  updateMedicineStock,
  adjustMedicineStock,
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

// PUT /api/medicines/:id - Update stock (Admin + Pharmacist can do absolute set)
router.put('/:id', protect, authorize('admin', 'super_admin', 'pharmacist'), updateMedicineStock);

// PATCH /api/medicines/:id/adjust - Adjust stock by amount (pharmacist + admin)
router.patch('/:id/adjust', protect, authorize('admin', 'super_admin', 'pharmacist'), adjustMedicineStock);

export default router;
