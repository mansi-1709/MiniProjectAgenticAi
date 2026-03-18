import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
  },
  medicines: [{
    medicineName: {
      type: String,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
  }],
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
});

// Index for faster patient lookups
prescriptionSchema.index({ patientId: 1, active: 1 });

export default mongoose.model('Prescription', prescriptionSchema);
