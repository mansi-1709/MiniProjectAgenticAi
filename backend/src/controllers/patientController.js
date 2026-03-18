import Patient from '../models/Patient.js';
import Order from '../models/Order.js';

/**
 * Patient Controller
 * Handles patient registration and retrieval
 */

// Register a new patient
export const registerPatient = async (req, res) => {
  try {
    const { name, phone, age } = req.body;

    // Validate input
    if (!name || !phone || !age) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and age are required',
      });
    }

    // Validate phone number format (Indian: 10 digits starting with 7, 8, or 9)
    if (!/^[789]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits starting with 7, 8, or 9',
      });
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ phone });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'Patient with this phone number already exists',
        patient: existingPatient,
      });
    }

    // Create new patient
    const patient = new Patient({ name, phone, age });
    await patient.save();

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      patient,
    });
  } catch (error) {
    console.error('Register Patient Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register patient',
      error: error.message,
    });
  }
};

// Get all patients
export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error('Get Patients Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients',
      error: error.message,
    });
  }
};

// Get patient by phone number
export const getPatientByPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    
    const patient = await Patient.findOne({ phone });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }
    
    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error('Get Patient by Phone Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message,
    });
  }
};

/**
 * NEW: Get patient medication history
 * Shows all previous orders with dosage information
 */
export const getPatientMedicationHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Get patient's order history - ONLY APPROVED ORDERS (actually dispensed medicines)
    const orders = await Order.find({ 
      patientId,
      status: 'APPROVED' // Only show medicines that were actually given to patient
    })
      .sort({ createdAt: -1 }) // Most recent first
      .limit(20) // Last 20 orders
      .lean();

    // Format medication history - filter out items with 0 quantity
    const medicationHistory = orders
      .map((order) => ({
        orderId: order._id,
        date: order.createdAt,
        status: order.status,
        medicines: order.items
          .filter(item => item.quantity > 0) // Only show medicines with quantity > 0
          .map((item) => ({
            name: item.medicineName,
            quantity: item.quantity,
            dosageDuration: item.dosageDuration || 'Not specified',
            totalDaysSupply: item.totalDaysSupply || 0,
            price: item.price,
            subtotal: item.subtotal,
          })),
        totalAmount: order.totalAmount,
      }))
      .filter(order => order.medicines.length > 0); // Remove orders with no valid medicines

    res.json({
      success: true,
      patient: {
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
        medicalConditions: patient.medicalConditions,
        allergies: patient.allergies,
      },
      medicationHistory,
      totalOrders: medicationHistory.length,
    });
  } catch (error) {
    console.error('Get Medication History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medication history',
      error: error.message,
    });
  }
};

// Delete a patient
export const deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    // Delete the patient
    await Patient.findByIdAndDelete(patientId);

    res.json({
      success: true,
      message: `Patient ${patient.name} deleted successfully`,
      deletedPatient: {
        id: patient._id,
        name: patient.name,
        phone: patient.phone,
      },
    });
  } catch (error) {
    console.error('Delete Patient Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient',
      error: error.message,
    });
  }
};
