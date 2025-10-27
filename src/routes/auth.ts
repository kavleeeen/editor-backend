import express from 'express';
import authController from '../controllers/AuthController';

const router = express.Router();

// Register new user
router.post('/register', authController.register.bind(authController));

// Login user
router.post('/login', authController.login.bind(authController));

export default router;

