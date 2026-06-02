const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Extract database name from the MONGO_URI to force-set it in dbName option
    let dbName = 'civic_complaints_db'; // default fallback
    try {
      const uriPath = process.env.MONGO_URI.split('//')[1]?.split('@')[1] || process.env.MONGO_URI;
      const pathWithDb = uriPath.split('/')[1];
      if (pathWithDb) {
        const extractedDb = pathWithDb.split('?')[0];
        if (extractedDb) dbName = extractedDb;
      }
    } catch (e) {
      // Ignore parsing errors and keep fallback
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: dbName,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log(`\n==================================================`);
    console.log(`✅ MongoDB Connection Verified successfully!`);
    console.log(`   Host:     ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name} (Forced via dbName: ${dbName})`);
    
    // Quick verify check to count total users
    try {
      const db = conn.connection.db;
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log(`   Collections found: [ ${collectionNames.join(', ')} ]`);
      
      if (collectionNames.includes('users')) {
        const userCount = await db.collection('users').countDocuments();
        console.log(`   Total Users in 'users' collection: ${userCount}`);
      } else {
        console.log(`   Total Users in 'users' collection: 0 (No 'users' collection exists yet)`);
      }
    } catch (dbErr) {
      console.log(`   Could not query collections: ${dbErr.message}`);
    }
    console.log(`==================================================\n`);
    
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
