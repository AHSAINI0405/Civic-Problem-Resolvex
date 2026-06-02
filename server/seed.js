require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

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

mongoose.connect(process.env.MONGO_URI, { dbName: dbName }).then(async () => {
  try {
    await User.deleteMany({ email: { $in: ['admin@civic.com', 'citizen@civic.com', 'dept@civic.com'] } });
    
    await User.create({ name: 'Admin User', email: 'admin@civic.com', password: 'password', role: 'admin', isVerified: true });
    await User.create({ name: 'Citizen Demo', email: 'citizen@civic.com', password: 'password', role: 'citizen', isVerified: true });
    await User.create({ name: 'Department Head', email: 'dept@civic.com', password: 'password', role: 'department', isVerified: true });
    
    console.log('Demo users seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
});
