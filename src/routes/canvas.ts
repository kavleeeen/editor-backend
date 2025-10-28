import express from 'express';
import CanvasController from '../controllers/CanvasController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All canvas routes require authentication

// Create a new blank canvas - must be before GET / to avoid conflict
router.post('/', authenticateToken, CanvasController.createBlankCanvas.bind(CanvasController));

// List all canvas designs for the authenticated user - must be before GET /:id
router.get('/', authenticateToken, CanvasController.listCanvases.bind(CanvasController));

// Get all users (for sharing purposes) - MUST be before /:id route
router.get('/users', authenticateToken, CanvasController.getAllUsers.bind(CanvasController));

// Share canvas with another user
router.post('/share', authenticateToken, CanvasController.shareCanvas.bind(CanvasController));

// Share canvas with multiple users
router.post('/share-multiple', authenticateToken, CanvasController.shareCanvasWithMultipleUsers.bind(CanvasController));

// Comment routes for a specific canvas - MUST be before /:id route
// Save comment for a canvas
router.post('/:canvasId/comments', authenticateToken, CanvasController.saveComment.bind(CanvasController));

// Get all comments for a canvas
router.get('/:canvasId/comments', authenticateToken, CanvasController.getComments.bind(CanvasController));

// Update existing canvas design
router.patch('/:id', authenticateToken, CanvasController.updateCanvas.bind(CanvasController));

// Get canvas design by ID
router.get('/:id', authenticateToken, CanvasController.getCanvas.bind(CanvasController));

// Delete canvas design
router.delete('/:id', authenticateToken, CanvasController.deleteCanvas.bind(CanvasController));

export default router;

