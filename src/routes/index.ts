import express from 'express';
import AppController from '../controllers/AppController';
import authRoutes from './auth';
import canvasRoutes from './canvas';
import uploadRoutes from './upload';

const router = express.Router();

// Main app route
router.get('/', AppController.getHello);

// Auth routes (public, no authentication required)
router.use('/auth', authRoutes);

// Upload routes (public, no authentication required)
router.use('/upload', uploadRoutes);

// Canvas routes (require authentication)
router.use('/canvas', canvasRoutes);

export default router;
