import { MongoClient, Db, Collection } from 'mongodb';

export interface CanvasAccess {
  _id: string;
  canvasId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

class CanvasAccessModel {
  private db: Db | null = null;
  private collection: Collection<CanvasAccess> | null = null;

  async connect(mongoUri: string, dbName: string = 'editor'): Promise<void> {
    const client = new MongoClient(mongoUri);
    await client.connect();
    this.db = client.db(dbName);
    this.collection = this.db.collection<CanvasAccess>('canvas_access');

    // Create indexes with error handling for existing indexes
    try {
      await this.collection.createIndex({ canvasId: 1, userId: 1 }, { unique: true });
    } catch (error: any) {
      if (error.code === 86) { // IndexKeySpecsConflict
        console.log('Index canvasId_1_userId_1 already exists, skipping...');
      } else {
        throw error;
      }
    }

    try {
      await this.collection.createIndex({ canvasId: 1 });
    } catch (error: any) {
      if (error.code === 86) {
        console.log('Index canvasId_1 already exists, skipping...');
      } else {
        throw error;
      }
    }

    try {
      await this.collection.createIndex({ userId: 1 });
    } catch (error: any) {
      if (error.code === 86) {
        console.log('Index userId_1 already exists, skipping...');
      } else {
        throw error;
      }
    }
  }

  async hasAccess(canvasId: string, userId: string, requiredRole: 'owner' | 'editor' | 'viewer'): Promise<boolean> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    // Role hierarchy: owner > editor > viewer
    const roleHierarchy = {
      'owner': 3,
      'editor': 2,
      'viewer': 1
    };

    const requiredLevel = roleHierarchy[requiredRole];

    const access = await this.collection.findOne({
      canvasId,
      userId,

    });

    if (!access) {
      console.log('[hasAccess] No access record', { canvasId, userId, requiredRole });
      return false;
    }

    const userLevel = roleHierarchy[access.role];
    const permitted = userLevel >= requiredLevel;
    console.log('[hasAccess] Access check', { canvasId, userId, role: access.role, requiredRole, permitted });
    return permitted;
  }

  async grantAccess(canvasId: string, userId: string, role: 'owner' | 'editor' | 'viewer', grantedBy: string, expiresAt?: Date): Promise<CanvasAccess> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const access: CanvasAccess = {
      _id: `${canvasId}-${userId}`,
      canvasId,
      userId,
      role,
      grantedBy,
      grantedAt: new Date(),
      expiresAt
    };

    await this.collection.replaceOne(
      { _id: access._id },
      access,
      { upsert: true }
    );

    return access;
  }

  async revokeAccess(canvasId: string, userId: string): Promise<boolean> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const result = await this.collection.deleteOne({
      canvasId,
      userId
    });

    return result.deletedCount > 0;
  }

  async getCanvasAccess(canvasId: string): Promise<CanvasAccess[]> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    return await this.collection.find({
      canvasId,

    }).toArray();
  }

  async getUserAccess(userId: string): Promise<CanvasAccess[]> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    return await this.collection.find({
      userId,

    }).toArray();
  }

  async createOwnerAccess(canvasId: string, userId: string): Promise<void> {
    await this.grantAccess(canvasId, userId, 'owner', userId);
  }

  async getUserCanvases(userId: string): Promise<string[]> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const accesses = await this.collection.find({
      userId,

    }).toArray();

    const canvasIds = accesses.map(access => access.canvasId);
    console.log('[getUserCanvases] Active accesses', { userId, count: canvasIds.length, canvasIds });
    return canvasIds;
  }

  async deleteCanvasAccess(canvasId: string): Promise<boolean> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const result = await this.collection.deleteMany({
      canvasId
    });

    return result.deletedCount > 0;
  }
}

export default new CanvasAccessModel();