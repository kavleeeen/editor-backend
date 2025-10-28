import { MongoClient, Db, Collection } from 'mongodb';
import { randomUUID } from 'crypto';
import canvasAccessModel from './CanvasAccess';

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
  yjsState?: Buffer; // Binary state for Yjs synchronization
  lastSaved?: Date; // Last time Yjs state was saved to DB
}

class CanvasDesignModel {
  private db: Db | null = null;
  private collection: Collection<CanvasDesign> | null = null;

  async connect(mongoUri: string, dbName: string = 'editor'): Promise<void> {
    const client = new MongoClient(mongoUri);
    await client.connect();
    this.db = client.db(dbName);
    this.collection = this.db.collection<CanvasDesign>('canvas_designs');

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

  async findUserAccessibleCanvases(userId: string, limit: number = 50, offset: number = 0): Promise<{ data: CanvasDesign[]; total: number }> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    // Get canvas IDs that the user has access to
    const userAccess = await canvasAccessModel.getUserCanvases(userId);
    const canvasIds = userAccess;

    if (canvasIds.length === 0) {
      return { data: [], total: 0 };
    }

    const data = await this.collection
      .find(
        { _id: { $in: canvasIds } },
        {
          projection: { designData: 0 } // Exclude designData from list view
        }
      )
      .sort({ 'metadata.updatedAt': -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await this.collection.countDocuments({ _id: { $in: canvasIds } });

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

    if (result.deletedCount > 0) {
      // Clean up access records when canvas is deleted
      await canvasAccessModel.deleteCanvasAccess(id);
    }

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

    // Grant owner access to the creator
    await canvasAccessModel.grantAccess(id, userId, 'owner', userId);

    return canvasDesign;
  }

  async saveYjsState(canvasId: string, yjsState: Uint8Array): Promise<void> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    await this.collection.updateOne(
      { _id: canvasId },
      {
        $set: {
          yjsState: Buffer.from(yjsState),
          lastSaved: new Date(),
          'metadata.updatedAt': new Date(),
        },
      }
    );
  }

  async loadYjsState(canvasId: string): Promise<Uint8Array | null> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const canvas = await this.collection.findOne({ _id: canvasId });
    return canvas?.yjsState ? new Uint8Array(canvas.yjsState) : null;
  }
}

export default new CanvasDesignModel();

