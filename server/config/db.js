import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongodInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/attendx';

  try {
    // Attempt standard connection with 2.5s timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    console.log(`[Database] Connected to MongoDB at: ${uri.split('@').pop()}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to local MongoDB (${err.message}).`);
    console.log('[Database] Starting embedded MongoMemoryServer for standalone development...');

    try {
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();
      await mongoose.connect(memoryUri);
      console.log(`[Database] Connected to MongoMemoryServer at: ${memoryUri}`);
    } catch (memErr) {
      console.error('[Database] Failed to start in-memory database:', memErr);
      process.exit(1);
    }
  }
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
};

