import express from 'express';
import {
  registerPatient,
  getAllPatients,
  getPatientByPhone,
  getPatientMedicationHistory,
  deletePatient,
} from '../controllers/patientController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// POST /api/patients - Register new patient (Protected)
router.post('/', protect, registerPatient);

// GET /api/patients - Get all patients (Protected)
router.get('/', protect, getAllPatients);

// GET /api/patients/phone/:phone - Get patient by phone (Protected)
router.get('/phone/:phone', protect, getPatientByPhone);

// DELETE /api/patients/:patientId - Delete patient (Protected)
router.delete('/:patientId', protect, deletePatient);

// GET /api/patients/:patientId/medication-history - Get patient medication history (Protected)
router.get('/:patientId/medication-history', protect, getPatientMedicationHistory);

export default router;
