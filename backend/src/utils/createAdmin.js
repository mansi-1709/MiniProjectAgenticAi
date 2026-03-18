import mongoose from 'mongoose';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { connectDB } from '../config/database.js';

const createAdminUser = async () => {
  try {
    // Connect to database
    await connectDB();

    // Check if super admin already exists
    const existingAdmin = await User.findOne({ role: 'super_admin', status: 'active' });
    
    if (existingAdmin) {
      console.log('✅ Super Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      process.exit(0);
    }

    // Create super admin user
    const adminData = {
      name: 'Super Admin',
      email: 'superadmin@pharmacy.com',
      password: 'Admin@123', // Strong password with uppercase, lowercase, number, and special character
      role: 'super_admin',
      phone: '9999999999',
      status: 'active',
    };

    const admin = await User.create(adminData);

    console.log('✅ Super Admin user created successfully!');
    console.log('');
    console.log('===============================');
    console.log('   LOGIN CREDENTIALS');
    console.log('===============================');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: Admin@123`);
    console.log(`   Role: ${admin.role}`);
    console.log('===============================');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');
    console.log('');
    console.log('📝 This Super Admin can approve both doctors and pharmacists.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();
