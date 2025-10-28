import express from 'express';
import UploadController from '../controllers/UploadController';

const router = express.Router();

// File upload endpoint
router.post('/', UploadController.uploadMiddleware, UploadController.uploadFile);

// Generate signed URLs for existing files
router.get('/signed-url/:filename', UploadController.generateSignedUrls);

export default router;
