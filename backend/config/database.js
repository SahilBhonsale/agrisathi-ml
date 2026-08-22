const mongoose = require('mongoose');

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agrisathi')
      .then((connection) => {
        console.log(`✅ MongoDB Connected: ${connection.connection.host}`);
        return connection.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        console.error('❌ MongoDB connection error:', error.message);
        throw error;
      });
  }

  return connectionPromise;
};

module.exports = connectDB;
