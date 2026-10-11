/**
 * Seed Demo Users Script
 * Creates two demo users for recruiter / demo access:
 *   1. demo.doctor@pharmacy.com  → role: admin,       status: active
 *   2. demo.pharma@pharmacy.com  → role: pharmacist,  status: active
 *
 * Run with: npm run seed-demo
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ─── Inline minimal User model (avoids index issues with full model) ────────
const userSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true, lowercase: true },
  password:       { type: String, required: true },
  role:           { type: String, enum: ['super_admin', 'admin', 'pharmacist'], required: true },
  status:         { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
  phone:          { type: String },
  createdAt:      { type: Date, default: Date.now },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// ─── Demo user definitions ────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    name:     'Demo Doctor (Admin)',
    email:    'demo.doctor@pharmacy.com',
    password: 'DemoDoctor@123',
    role:     'admin',
    status:   'active',
    phone:    '9000000001',
  },
  {
    name:     'Demo Pharmacist',
    email:    'demo.pharma@pharmacy.com',
    password: 'DemoPharma@123',
    role:     'pharmacist',
    status:   'active',
    phone:    '9000000002',
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seedDemoUsers() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('❌  MONGO_URI not found in .env file');
    process.exit(1);
  }

  try {
    console.log('🔌  Connecting to MongoDB…');
    await mongoose.connect(uri);
    console.log('✅  Connected\n');

    for (const demo of DEMO_USERS) {
      const existing = await User.findOne({ email: demo.email });

      if (existing) {
        // Ensure status is active and update password in case it changed
        const salt     = await bcrypt.genSalt(10);
        const hashed   = await bcrypt.hash(demo.password, salt);
        existing.status   = 'active';
        existing.password = hashed;
        await existing.save();
        console.log(`🔄  Updated  → ${demo.email}  (${demo.role})`);
      } else {
        const salt   = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(demo.password, salt);
        await User.create({ ...demo, password: hashed });
        console.log(`✅  Created  → ${demo.email}  (${demo.role})`);
      }
    }

    console.log('\n🎉  Demo users ready!\n');
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  DEMO CREDENTIALS                                       │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│  Doctor / Admin Panel                                   │');
    console.log('│    Email    : demo.doctor@pharmacy.com                  │');
    console.log('│    Password : DemoDoctor@123                            │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log('│  Pharmacist Panel                                       │');
    console.log('│    Email    : demo.pharma@pharmacy.com                  │');
    console.log('│    Password : DemoPharma@123                            │');
    console.log('└─────────────────────────────────────────────────────────┘\n');

  } catch (err) {
    console.error('❌  Error seeding demo users:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  Disconnected from MongoDB');
  }
}

seedDemoUsers();
