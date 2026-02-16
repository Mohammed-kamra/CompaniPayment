const bcrypt = require('bcrypt');
const { connectDB, getDB, closeDB } = require('../config/database');

async function hashAllPasswords() {
  try {
    await connectDB();
    const db = getDB();
    
    console.log('🔍 Finding all users...');
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`📊 Found ${users.length} users`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const user of users) {
      // Skip if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'))) {
        console.log(`⏭️  Skipping user "${user.name}" - password already hashed`);
        skipped++;
        continue;
      }
      
      // Skip if no password
      if (!user.password || user.password.trim() === '') {
        console.log(`⏭️  Skipping user "${user.name}" - no password`);
        skipped++;
        continue;
      }
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      // Update user with hashed password
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log(`✅ Hashed password for user "${user.name}"`);
      updated++;
    }
    
    console.log(`\n✅ Complete! Updated ${updated} users, skipped ${skipped} users`);
  } catch (error) {
    console.error('❌ Error hashing passwords:', error);
  } finally {
    await closeDB();
  }
}

hashAllPasswords();
