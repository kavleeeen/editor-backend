import express from 'express';
import CanvasController from '../controllers/CanvasController';

const router = express.Router();

// Save or update canvas design
router.post('/:id/save', CanvasController.saveCanvas);

// Get canvas design by ID
router.get('/:id', CanvasController.getCanvas);

// List all canvas designs
router.get('/', CanvasController.listCanvases);

// Delete canvas design
router.delete('/:id', CanvasController.deleteCanvas);

export default router;

