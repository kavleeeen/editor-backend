import { Request, Response } from 'express';
import userModel from '../models/User';
import { generateToken } from '../utils/jwt';

interface RegisterRequest extends Request {
  body: {
    email: string;
    password: string;
    name: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

class AuthController {
  async register(req: RegisterRequest, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      // Validate inputs
      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Email, password, and name are required',
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid email format',
        });
        return;
      }

      // Validate password length
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Password must be at least 6 characters long',
        });
        return;
      }

      const user = await userModel.create(email, password, name);
      const token = generateToken(user._id!.toString(), user.email);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
          },
          token,
        },
      });
    } catch (error: any) {
      console.error('Error registering user:', error);

      if (error.message.includes('already exists')) {
        res.status(409).json({
          success: false,
          error: 'Conflict',
          message: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async login(req: LoginRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate inputs
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Email and password are required',
        });
        return;
      }

      const user = await userModel.validatePassword(email, password);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
        return;
      }

      const token = generateToken(user._id!.toString(), user.email);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
          },
          token,
        },
      });
    } catch (error: any) {
      console.error('Error logging in:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new AuthController();

