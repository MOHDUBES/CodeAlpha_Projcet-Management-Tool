import mongoose from 'mongoose';
import logger from '../utils/logger';

import { MongoMemoryReplSet } from 'mongodb-memory-server';

let mongoServer: MongoMemoryReplSet | null = null;

const connectDB = async (): Promise<void> => {
  try {
    let mongoURI = process.env.MONGODB_URI;
    
    // If no URI provided, spin up an in-memory database for local testing
    if (!mongoURI) {
      logger.warn('MONGODB_URI not found. Starting in-memory MongoDB Replica Set for testing...');
      mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      mongoURI = mongoServer.getUri();
      
      // Also mock JWT_SECRET if it's missing for quick local testing
      if (!process.env.JWT_ACCESS_SECRET) {
        process.env.JWT_ACCESS_SECRET = 'local_access_secret_do_not_use_in_prod';
      }
      if (!process.env.JWT_REFRESH_SECRET) {
        process.env.JWT_REFRESH_SECRET = 'local_refresh_secret_do_not_use_in_prod';
      }
    }

    const conn = await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
