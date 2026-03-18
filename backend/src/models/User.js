import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email'
    },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't return password by default
    validate: {
      validator: function(v) {
        // Check for at least one lowercase, uppercase, number, and special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    },
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'pharmacist'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected'],
    default: function() {
      // Auto-approve super_admin, others need approval
      return this.role === 'super_admin' ? 'active' : 'pending';
    },
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // If phone is provided, validate it (Indian mobile format: 10 digits starting with 6-9)
        if (!v) return true; // Optional field
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please enter a valid 10-digit Indian mobile number starting with 6-9'
    },
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpire: {
    type: Date,
    select: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Index for faster email lookups
userSchema.index({ email: 1 });
userSchema.index({ status: 1, role: 1 });

export default mongoose.model('User', userSchema);
