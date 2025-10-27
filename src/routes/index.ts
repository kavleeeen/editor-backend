import express from 'express';
import AppController from '../controllers/AppController';
import canvasRoutes from './canvas';

const router = express.Router();

// Main app route
router.get('/', AppController.getHello);

// Canvas routes
router.use('/canvas', canvasRoutes);

export default router;
