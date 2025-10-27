import { MongoClient, Db, Collection } from 'mongodb';

export interface CanvasMetadata {
  title?: string;
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasDesign {
  _id: string;
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
    await this.collection.createIndex({ 'metadata.createdAt': -1 });
    await this.collection.createIndex({ 'metadata.updatedAt': -1 });
  }

  async save(id: string, designData: any, metadata: Partial<CanvasMetadata>): Promise<CanvasDesign> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const now = new Date();
    const canvasDesign: CanvasDesign = {
      _id: id,
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

  async findById(id: string): Promise<CanvasDesign | null> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }
    return await this.collection.findOne({ _id: id });
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<{ data: CanvasDesign[]; total: number }> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const data = await this.collection
      .find({}, { 
        projection: { designData: 0 } // Exclude designData from list view
      })
      .sort({ 'metadata.updatedAt': -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments();

    return { data, total };
  }

  async delete(id: string): Promise<boolean> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }
    const result = await this.collection.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}

export default new CanvasDesignModel();

