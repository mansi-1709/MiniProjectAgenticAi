import Medicine from '../models/Medicine.js';

/**
 * Medicine Controller
 * Handles medicine CRUD operations
 */

// Add new medicine
export const addMedicine = async (req, res) => {
  try {
    const { name, unit, price, stockQty, minStockThreshold, prescriptionRequired } = req.body;

    // Validate input
    if (!name || !unit || price === undefined || stockQty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, unit, price, and stockQty are required',
      });
    }

    // Check if medicine already exists
    const existingMedicine = await Medicine.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingMedicine) {
      return res.status(400).json({
        success: false,
        message: 'Medicine with this name already exists',
      });
    }

    // Create new medicine
    const medicine = new Medicine({
      name,
      unit,
      price,
      stockQty,
      minStockThreshold: minStockThreshold || 10,
      prescriptionRequired: prescriptionRequired || false,
    });
    
    await medicine.save();

    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      medicine,
    });
  } catch (error) {
    console.error('Add Medicine Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add medicine',
      error: error.message,
    });
  }
};

// Get all medicines
export const getAllMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ name: 1 });
    
    res.json({
      success: true,
      count: medicines.length,
      medicines,
    });
  } catch (error) {
    console.error('Get Medicines Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch medicines',
      error: error.message,
    });
  }
};

// Update medicine stock
export const updateMedicineStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stockQty } = req.body;

    if (stockQty === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity is required',
      });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      id,
      { stockQty },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found',
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      medicine,
    });
  } catch (error) {
    console.error('Update Stock Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: error.message,
    });
  }
};

// Get low stock medicines
export const getLowStockMedicines = async (req, res) => {
  try {
    const lowStockMedicines = await Medicine.find({
      $expr: { $lte: ['$stockQty', '$minStockThreshold'] }
    }).sort({ stockQty: 1 });

    res.json({
      success: true,
      count: lowStockMedicines.length,
      medicines: lowStockMedicines,
    });
  } catch (error) {
    console.error('Get Low Stock Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock medicines',
      error: error.message,
    });
  }
};
