import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import Medicine from '../models/Medicine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Import medicines from JSON file
 * Usage: node src/utils/importMedicines.js
 */
async function importMedicines() {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Read medicines from JSON file
    const medicinesPath = path.join(__dirname, '../../medicines.json');
    const medicinesData = JSON.parse(fs.readFileSync(medicinesPath, 'utf-8'));

    console.log(`📦 Found ${medicinesData.length} medicines to import\n`);

    // Import medicines
    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const medicineData of medicinesData) {
      try {
        // Check if medicine already exists
        const existing = await Medicine.findOne({ name: medicineData.name });

        if (existing) {
          // Update existing medicine
          Object.assign(existing, medicineData);
          await existing.save();
          console.log(`🔄 Updated: ${medicineData.name}`);
          updated++;
        } else {
          // Create new medicine
          const medicine = new Medicine(medicineData);
          await medicine.save();
          console.log(`✅ Imported: ${medicineData.name}`);
          imported++;
        }
      } catch (error) {
        console.log(`❌ Skipped ${medicineData.name}: ${error.message}`);
        skipped++;
      }
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║       IMPORT SUMMARY                   ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`✅ Imported: ${imported}`);
    console.log(`🔄 Updated:  ${updated}`);
    console.log(`❌ Skipped:  ${skipped}`);
    console.log(`📊 Total:    ${medicinesData.length}\n`);

    // Display all medicines in database
    const allMedicines = await Medicine.find().sort({ name: 1 });
    console.log('📋 Current medicines in database:');
    console.log('─────────────────────────────────────────');
    allMedicines.forEach((med, index) => {
      console.log(`${index + 1}. ${med.name} - ₹${med.price} (Stock: ${med.stockQty})`);
    });
    console.log('─────────────────────────────────────────\n');

    await mongoose.disconnect();
    console.log('✅ Import complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    process.exit(1);
  }
}

// Run the import
importMedicines();
