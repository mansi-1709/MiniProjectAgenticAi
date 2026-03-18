import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/database.js';

const fixSuperAdmin = async () => {
  try {
    await connectDB();

    // Find super admin
    const superAdmin = await User.findOne({ email: 'superadmin@pharmacy.com' });
    
    if (!superAdmin) {
      console.log('❌ Super admin not found!');
      process.exit(1);
    }

    console.log('📋 Current super admin status:', superAdmin.status);
    console.log('📋 Current super admin role:', superAdmin.role);

    // Update to active super_admin if not already
    let updated = false;
    
    if (superAdmin.status !== 'active') {
      superAdmin.status = 'active';
      updated = true;
      console.log('✅ Status updated to ACTIVE');
    }
    
    if (superAdmin.role !== 'super_admin') {
      superAdmin.role = 'super_admin';
      updated = true;
      console.log('✅ Role updated to SUPER_ADMIN');
    }
    
    if (updated) {
      await superAdmin.save();
      console.log('✅ Changes saved to database');
    } else {
      console.log('✅ Super admin is already configured correctly');
    }

    console.log('');
    console.log('===============================');
    console.log('   SUPER ADMIN CREDENTIALS');
    console.log('===============================');
    console.log(`   Email: superadmin@pharmacy.com`);
    console.log(`   Password: Admin@123`);
    console.log(`   Status: ${superAdmin.status}`);
    console.log(`   Role: ${superAdmin.role}`);
    console.log('===============================');
    console.log('');
    console.log('🚀 You can now login and access /admin route');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixSuperAdmin();
