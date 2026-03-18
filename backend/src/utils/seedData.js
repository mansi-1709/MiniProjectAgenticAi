import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Medicine from '../models/Medicine.js';
import Patient from '../models/Patient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory (three levels up from utils folder)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const medicines = [
  {
    name: 'Paracetamol',
    unit: 'tablet',
    price: 5,
    stockQty: 100,
    minStockThreshold: 20,
    prescriptionRequired: false,
  },
  {
    name: 'Aspirin',
    unit: 'tablet',
    price: 8,
    stockQty: 50,
    minStockThreshold: 15,
    prescriptionRequired: false,
  },
  {
    name: 'Amoxicillin',
    unit: 'capsule',
    price: 15,
    stockQty: 30,
    minStockThreshold: 10,
    prescriptionRequired: true,
  },
  {
    name: 'Ibuprofen',
    unit: 'tablet',
    price: 10,
    stockQty: 80,
    minStockThreshold: 25,
    prescriptionRequired: false,
  },
  {
    name: 'Cough Syrup',
    unit: 'syrup',
    price: 120,
    stockQty: 15,
    minStockThreshold: 5,
    prescriptionRequired: false,
  },
  {
    name: 'Vitamin D',
    unit: 'capsule',
    price: 12,
    stockQty: 60,
    minStockThreshold: 20,
    prescriptionRequired: false,
  },
  {
    name: 'Azithromycin',
    unit: 'tablet',
    price: 25,
    stockQty: 40,
    minStockThreshold: 15,
    prescriptionRequired: true,
  },
  {
    name: 'Omeprazole',
    unit: 'capsule',
    price: 18,
    stockQty: 55,
    minStockThreshold: 20,
    prescriptionRequired: false,
  },
  {
    name: 'Insulin',
    unit: 'injection',
    price: 450,
    stockQty: 8,
    minStockThreshold: 5,
    prescriptionRequired: true,
  },
  {
    name: 'Cetirizine',
    unit: 'tablet',
    price: 6,
    stockQty: 90,
    minStockThreshold: 30,
    prescriptionRequired: false,
  },
];

const patients = [
  {
    name: 'Rajesh Kumar',
    phone: '9876543210',
    age: 45,
  },
  {
    name: 'Priya Sharma',
    phone: '9876543211',
    age: 32,
  },
  {
    name: 'Amit Patel',
    phone: '9876543212',
    age: 28,
  },
  {
    name: 'Sunita Reddy',
    phone: '9876543213',
    age: 55,
  },
  {
    name: 'Vikram Singh',
    phone: '9876543214',
    age: 38,
  },
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Medicine.deleteMany({});
    await Patient.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Insert medicines
    const insertedMedicines = await Medicine.insertMany(medicines);
    console.log(`✅ Inserted ${insertedMedicines.length} medicines`);

    // Insert patients
    const insertedPatients = await Patient.insertMany(patients);
    console.log(`✅ Inserted ${insertedPatients.length} patients`);

    console.log('\n✨ Database seeded successfully!');
    console.log('\nSample Data:');
    console.log('─────────────────────────────────────');
    console.log('\nMedicines:');
    insertedMedicines.forEach((med, i) => {
      console.log(`  ${i + 1}. ${med.name} - ₹${med.price} (Stock: ${med.stockQty})`);
    });
    console.log('\nPatients:');
    insertedPatients.forEach((patient, i) => {
      console.log(`  ${i + 1}. ${patient.name} - ${patient.phone}`);
    });
    console.log('\n─────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Error:', error);
    process.exit(1);
  }
};

seedDatabase();
