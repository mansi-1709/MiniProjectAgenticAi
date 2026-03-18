import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    unique: true,
    trim: true,
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['tablet', 'capsule', 'syrup', 'injection', 'cream', 'drops'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be positive'],
  },
  stockQty: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  minStockThreshold: {
    type: Number,
    required: [true, 'Minimum stock threshold is required'],
    min: [0, 'Threshold must be positive'],
    default: 10,
  },
  prescriptionRequired: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster medicine name lookups
medicineSchema.index({ name: 1 });

export default mongoose.model('Medicine', medicineSchema);
