import canvasModel from '../models/CanvasDesign';
import userModel from '../models/User';
import canvasAccessModel from '../models/CanvasAccess';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'editor';

let isConnected = false;

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

    // Connect all models
    await canvasModel.connect(MONGODB_URI, DB_NAME);
    await userModel.connect(MONGODB_URI, DB_NAME);
    await canvasAccessModel.connect(MONGODB_URI, DB_NAME);

    isConnected = true;
    console.log('✓ Database connected successfully');
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    throw error;
  }
}

export default { connectDatabase };
