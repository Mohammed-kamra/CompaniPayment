const bcrypt = require('bcrypt');
const { connectDB, getDB, closeDB } = require('../config/database');

async function setUserPassword(username, newPassword) {
  try {
    await connectDB();
    const db = getDB();
    
    console.log(`🔍 Searching for user: "${username}"...\n`);
    
    // Search by name, email, or username (case-insensitive)
    const user = await db.collection('users').findOne({
      $or: [
        { username: { $regex: new RegExp(`^${username}$`, 'i') } },
        { email: { $regex: new RegExp(`^${username}$`, 'i') } },
        { name: { $regex: new RegExp(`^${username}$`, 'i') } }
      ]
    });
    
    if (!user) {
      console.log('❌ User not found!');
      await closeDB();
      return;
    }
    
    console.log(`✅ User found: ${user.name} (${user.role || 'user'})`);
    
    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update user password
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ Password updated successfully!');
    console.log(`   User: ${user.name}`);
    console.log(`   New password: ${newPassword}`);
    console.log('\n💡 User can now login with this password');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeDB();
  }
}

// Get username and password from command line arguments
const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.log('Usage: node scripts/setUserPassword.js <username> <newPassword>');
  console.log('Example: node scripts/setUserPassword.js accounting mypassword123');
  process.exit(1);
}

setUserPassword(username, newPassword);
