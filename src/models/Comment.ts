import { Db, Collection } from 'mongodb';
import { getDatabase } from '../config/database';

export interface Comment {
  _id: string;
  canvasId: string;
  id: string; // Client-generated ID (e.g., "clientId-timestamp-random")
  authorId: string; // UUID of the author
  timestamp: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

class CommentModel {
  private collection: Collection<Comment> | null = null;

  async connect(): Promise<void> {
    try {
      console.log('Initializing Comment model with centralized connection...');
      const db = getDatabase();
      this.collection = db.collection<Comment>('comments');
      console.log('Comment model initialized successfully');
    } catch (error) {
      console.error('Comment model initialization failed:', error);
      throw error;
    }
  }

  async saveComment(canvasId: string, comment: Omit<Comment, '_id' | 'canvasId' | 'createdAt' | 'updatedAt'>): Promise<Comment> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const now = new Date();
    const commentToInsert: Comment = {
      _id: `${canvasId}-${comment.id}`,
      canvasId,
      ...comment,
      createdAt: now,
      updatedAt: now,
    };

    // Use upsert to handle duplicate comments (based on canvasId + comment.id)
    await this.collection.replaceOne(
      { _id: commentToInsert._id },
      commentToInsert,
      { upsert: true }
    );

    return commentToInsert;
  }

  async getCommentsByCanvasId(canvasId: string): Promise<Comment[]> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    return await this.collection
      .find({ canvasId })
      .sort({ timestamp: 1 }) // Sort by timestamp ascending
      .toArray();
  }

  async deleteComment(canvasId: string, commentId: string): Promise<boolean> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const result = await this.collection.deleteOne({
      _id: `${canvasId}-${commentId}`,
    });

    return result.deletedCount > 0;
  }

  async deleteCommentsByCanvasId(canvasId: string): Promise<number> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const result = await this.collection.deleteMany({ canvasId });
    return result.deletedCount;
  }

  async updateComment(canvasId: string, commentId: string, updates: Partial<Pick<Comment, 'text'>>): Promise<Comment | null> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }

    const result = await this.collection.findOneAndUpdate(
      { _id: `${canvasId}-${commentId}` },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    return result || null;
  }
}

export default new CommentModel();
