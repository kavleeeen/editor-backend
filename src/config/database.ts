import { MongoClient, Db } from 'mongodb';
import canvasModel from '../models/CanvasDesign';
import userModel from '../models/User';
import canvasAccessModel from '../models/CanvasAccess';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'editor';

let isConnected = false;
let mongoClient: MongoClient | null = null;
let database: Db | null = null;

// Centralized MongoClient configuration
const mongoClientOptions = {
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  tls: true,
  tlsCAFile: '/etc/ssl/certs/ca-certificates.crt'
};

// Export the centralized MongoClient and database instance
export function getMongoClient(): MongoClient {
  if (!mongoClient) {
    throw new Error('MongoClient not initialized. Call connectDatabase() first.');
  }
  return mongoClient;
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return database;
}

export async function connectDatabase(): Promise<void> {
  try {
    if (isConnected) {
      console.log('✓ Database already connected');
      return;
    }

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log(`📦 Connecting to MongoDB: ${MONGODB_URI}`);

    // Create centralized MongoClient with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        mongoClient = new MongoClient(MONGODB_URI, mongoClientOptions);
        await mongoClient.connect();
        database = mongoClient.db(DB_NAME);

        // Initialize all models with the centralized connection
        await canvasModel.connect();
        await userModel.connect();
        await canvasAccessModel.connect();
        break;
      } catch (error) {
        retries--;
        console.error(`MongoDB connection attempt failed, retries left: ${retries}`, error);
        if (retries === 0) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }

    isConnected = true;
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    // Don't throw error immediately, let the server start without DB
    console.log('⚠️ Server will start without database connection');
  }
}

export default { connectDatabase };
