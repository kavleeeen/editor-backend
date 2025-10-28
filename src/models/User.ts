import { Db, Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import { getDatabase } from '../config/database';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

class UserModel {
  private collection: Collection<User> | null = null;

  async connect(): Promise<void> {
    try {
      console.log('Initializing User model with centralized connection...');
      const db = getDatabase();
      this.collection = db.collection<User>('users');

      // Create indexes
      await this.collection.createIndex({ email: 1 }, { unique: true });
      await this.collection.createIndex({ createdAt: -1 });
      console.log('User model initialized successfully');
    } catch (error) {
      console.error('User model initialization failed:', error);
      throw error;
    }
  }

  private getCollection(): Collection<User> {
    if (!this.collection) {
      throw new Error('Database not connected');
    }
    return this.collection;
  }

  async create(email: string, password: string, name: string): Promise<User> {
    const collection = this.getCollection();

    // Check if user already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const now = new Date();
    const user: User = {
      email,
      password: hashedPassword,
      name,
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(user);

    // Return user without password
    const createdUser = await collection.findOne({ _id: result.insertedId });
    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    // Remove password before returning
    const { password: _, ...userWithoutPassword } = createdUser;
    return userWithoutPassword as User;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.getCollection().findOne({ email });
  }

  async findById(id: string): Promise<User | null> {
    return await this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return null;
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async findUsers(query: any = {}, limit: number = 50, offset: number = 0): Promise<{ data: User[]; total: number }> {
    const collection = this.getCollection();

    const data = await collection
      .find(query, {
        projection: { password: 0 } // Exclude password from results
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(query);

    return { data, total };
  }
}

export default new UserModel();

