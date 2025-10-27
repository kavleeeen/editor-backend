import { MongoClient, Db, Collection } from 'mongodb';
import { randomUUID } from 'crypto';

export interface CanvasMetadata {
  title?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasDesign {
  _id: string;
  userId: string; // Add userId to associate designs with users
  designData: {
    version: string;
    objects: any[];
    background: string;
    width?: number;
    height?: number;
  };
  metadata: CanvasMetadata;
}

class CanvasDesignModel {
  private db: Db | null = null;
  private collection: Collection<CanvasDesign> | null = null;

  async connect(mongoUri: string, dbName: string = 'editor'): Promise<void> {
    const client = new MongoClient(mongoUri);
    await client.connect();
    this.db = client.db(dbName);
    this.collection = this.db.collection<CanvasDesign>('canvas_designs');
    
    // Create indexes
    await this.collection.createIndex({ '_id': 1 });
    await this.collection.createIndex({ userId: 1 }); // Index for userId
    await this.collection.createIndex({ 'metadata.createdAt': -1 });
    await this.collection.createIndex({ 'metadata.updatedAt': -1 });
  }

  async save(id: string, userId: string, designData: any, metadata: Partial<CanvasMetadata>): Promise<CanvasDesign> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const now = new Date();
    const canvasDesign: CanvasDesign = {
      _id: id,
      userId, // Add userId to the design
      designData,
      metadata: {
        version: metadata.version || '1.0',
        createdAt: metadata.createdAt || now,
        updatedAt: now,
        title: metadata.title,
      },
    };

    await this.collection.replaceOne(
      { _id: id },
      canvasDesign,
      { upsert: true }
    );

    return canvasDesign;
  }

  async findById(id: string, userId?: string): Promise<CanvasDesign | null> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }
    const query: any = { _id: id };
    if (userId) {
      query.userId = userId;
    }
    return await this.collection.findOne(query);
  }

  async findAll(limit: number = 50, offset: number = 0, userId?: string): Promise<{ data: CanvasDesign[]; total: number }> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const query: any = {};
    if (userId) {
      query.userId = userId;
    }

    const data = await this.collection
      .find(query, { 
        projection: { designData: 0 } // Exclude designData from list view
      })
      .sort({ 'metadata.updatedAt': -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments(query);

    return { data, total };
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }
    const query: any = { _id: id };
    if (userId) {
      query.userId = userId;
    }
    const result = await this.collection.deleteOne(query);
    return result.deletedCount > 0;
  }

  async createBlank(userId: string, metadata?: Partial<CanvasMetadata>): Promise<CanvasDesign> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const id = randomUUID();
    const now = new Date();

    const blankDesignData = {
      version: '6.7.1', // Fabric.js version
      objects: [],
      background: 'white',
    };

    const canvasDesign: CanvasDesign = {
      _id: id,
      userId,
      designData: blankDesignData,
      metadata: {
        version: '1.0',
        createdAt: now,
        updatedAt: now,
        title: metadata?.title,
      },
    };

    await this.collection.insertOne(canvasDesign);

    return canvasDesign;
  }
}

export default new CanvasDesignModel();

