const bcrypt = require('bcrypt');
const { connectDB, getDB, closeDB } = require('../config/database');

async function createAdminUser() {
  try {
    await connectDB();
    const db = getDB();
    
    const adminUsername = 'admin';
    const adminPassword = '123'; // Default password - user should change this
    const adminEmail = 'admin@example.com';
    
    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({
      $or: [
        { username: adminUsername },
        { email: adminEmail },
        { name: adminUsername }
      ]
    });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Username: ${existingAdmin.username || existingAdmin.name}`);
      console.log(`   Email: ${existingAdmin.email || 'N/A'}`);
      console.log(`   Role: ${existingAdmin.role || 'N/A'}`);
      
      // Ask if they want to update the password
      console.log('\n💡 To reset the admin password, update it through the admin panel or use:');
      console.log('   db.users.updateOne({ name: "admin" }, { $set: { password: "<hashed_password>" } })');
      
      await closeDB();
      return;
    }
    
    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);
    
    // Create admin user
    const adminUser = {
      name: adminUsername,
      username: adminUsername,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Role: admin`);
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await closeDB();
  }
}

createAdminUser();
