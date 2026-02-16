const bcrypt = require('bcrypt');
const { connectDB, getDB, closeDB } = require('../config/database');

async function checkUser(username) {
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
      console.log('\n💡 Available users:');
      const allUsers = await db.collection('users').find({}).toArray();
      allUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.role || 'user'}) - Status: ${u.status || 'active'}`);
      });
      await closeDB();
      return;
    }
    
    console.log('✅ User found!');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email || 'N/A'}`);
    console.log(`   Username: ${user.username || 'N/A'}`);
    console.log(`   Role: ${user.role || 'user'}`);
    console.log(`   Status: ${user.status || 'active'}`);
    console.log(`   Has Password: ${user.password ? 'Yes (hashed)' : 'No'}`);
    console.log(`   Password Length: ${user.password ? user.password.length : 0} characters`);
    
    if (!user.password) {
      console.log('\n⚠️  User has no password!');
      console.log('💡 To set a password, use:');
      console.log('   node scripts/setUserPassword.js <username> <newPassword>');
    } else if (user.password.length < 50) {
      console.log('\n⚠️  Password appears to be unhashed!');
      console.log('💡 To hash the password, use:');
      console.log('   npm run hash:passwords');
    } else {
      console.log('\n✅ Password is properly hashed');
    }
    
    if (user.status !== 'active') {
      console.log(`\n⚠️  User status is "${user.status}" - user cannot login!`);
      console.log('💡 To activate the user, update status to "active" in the admin panel');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeDB();
  }
}

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.log('Usage: node scripts/checkUser.js <username>');
  console.log('Example: node scripts/checkUser.js accounting');
  process.exit(1);
}

checkUser(username);
