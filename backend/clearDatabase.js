require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const clearDatabase = async () => {
  try {
    await connectDB();

    // Get all collections
    const collections = await mongoose.connection.db.collections();

    console.log('Clearing all data from database...\n');

    // Delete all documents from each collection
    for (let collection of collections) {
      const result = await collection.deleteMany({});
      console.log(`✓ Deleted ${result.deletedCount} documents from ${collection.collectionName}`);
    }

    console.log('\n✅ Database cleared successfully! All accounts and data removed.');
    console.log('🎉 Your database is now completely fresh and ready to use!\n');

    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();
