import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

class UserModel {
  private db: Db | null = null;
  private collection: Collection<User> | null = null;

  async connect(mongoUri: string, dbName: string = 'editor'): Promise<void> {
    const client = new MongoClient(mongoUri);
    await client.connect();
    this.db = client.db(dbName);
    this.collection = this.db.collection<User>('users');

    // Create indexes
    await this.collection.createIndex({ email: 1 }, { unique: true });
    await this.collection.createIndex({ createdAt: -1 });
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
}

export default new UserModel();

