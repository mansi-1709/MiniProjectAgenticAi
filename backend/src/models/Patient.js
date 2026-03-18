import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[789]\d{9}$/.test(v);
      },
      message: 'Phone number must be 10 digits starting with 7, 8, or 9'
    },
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [0, 'Age must be positive'],
  },
  medicalConditions: {
    type: [String],
    default: [],
  },
  allergies: {
    type: [String],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster phone lookups
patientSchema.index({ phone: 1 });

export default mongoose.model('Patient', patientSchema);
