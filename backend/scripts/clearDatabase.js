require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Message = require('../models/Message');
const Group = require('../models/Group');
const Call = require('../models/Call');

async function clearDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Clearing all collections...');

    const results = await Promise.all([
      User.deleteMany({}),
      Message.deleteMany({}),
      Group.deleteMany({}),
      Call.deleteMany({})
    ]);

    console.log('\n✅ Database cleared successfully!');
    console.log('━'.repeat(50));
    console.log(`👥 Users deleted: ${results[0].deletedCount}`);
    console.log(`💬 Messages deleted: ${results[1].deletedCount}`);
    console.log(`👨‍👩‍👧‍👦 Groups deleted: ${results[2].deletedCount}`);
    console.log(`📞 Calls deleted: ${results[3].deletedCount}`);
    console.log('━'.repeat(50));
    console.log('\n🎉 Your database is now completely fresh!');
    console.log('You can now create new accounts and start testing.\n');

    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();
