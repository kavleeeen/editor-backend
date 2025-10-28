import { Request, Response } from 'express';
import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import { apiLogger } from '../middleware/logger';

// Initialize Google Cloud Storage with service account
const storage = new Storage({
  keyFilename: './service-account.json',
  projectId: 'acquired-voice-474914-j2'
});
const bucket = storage.bucket(process.env.GCS_BUCKET || '');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

class UploadController {
  // Middleware for handling file upload
  uploadMiddleware = upload.single('file');

  async uploadFile(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;

    try {
      apiLogger.success(req, 'File upload request received');

      if (!req.file) {
        apiLogger.warn(req, 'No file provided in upload request');
        res.status(400).json({
          success: false,
          error: 'No file provided',
          message: 'Please provide a file in the request'
        });
        return;
      }

      // Log file details
      apiLogger.success(req, 'File details received', {
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        encoding: req.file.encoding
      });

      // Check if GCS bucket is configured
      if (!process.env.GCS_BUCKET) {
        apiLogger.error(req, 'GCS bucket not configured - GCS_BUCKET environment variable missing');
        res.status(500).json({
          success: false,
          error: 'GCS bucket not configured',
          message: 'GCS_BUCKET environment variable is not set'
        });
        return;
      }

      // Create a safe filename with timestamp
      const timestamp = Date.now();
      const safeName = `${timestamp}_${req.file.originalname.replace(/\s+/g, '_')}`;

      apiLogger.success(req, 'Generated safe filename', { safeName });

      // Get file reference from bucket
      const file = bucket.file(safeName);

      // Create write stream
      const stream = file.createWriteStream({
        metadata: {
          contentType: req.file.mimetype
        },
        resumable: false // Set to true for large files (>5MB)
      });

      // Handle stream events
      stream.on('error', (err) => {
        apiLogger.error(req, 'GCS stream error during upload', {
          error: err.message,
          filename: safeName,
          bucket: process.env.GCS_BUCKET
        });
        res.status(500).json({
          success: false,
          error: 'Upload failed',
          message: err.message
        });
      });

      stream.on('finish', async () => {
        try {
          // Generate signed URL (valid for 1 hour by default)
          const [signedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
            version: 'v4'
          });

          // Also generate a longer-term signed URL (valid for 7 days) for frontend use
          const [longTermSignedUrl] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
            version: 'v4'
          });

          const uploadResult = {
            success: true,
            url: signedUrl, // Short-term URL (1 hour)
            longTermUrl: longTermSignedUrl, // Long-term URL (7 days)
            filename: safeName,
            originalName: req.file!.originalname,
            size: req.file!.size,
            mimetype: req.file!.mimetype,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour expiry
            longTermExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
          };

          apiLogger.success(req, 'File upload completed successfully with signed URLs', {
            filename: safeName,
            bucket: bucket.name,
            shortTermUrl: signedUrl,
            longTermUrl: longTermSignedUrl
          });

          res.status(200).json(uploadResult);
        } catch (err) {
          apiLogger.error(req, 'Error generating signed URLs after successful upload', {
            error: err instanceof Error ? err.message : 'Unknown error',
            filename: safeName
          });
          res.status(500).json({
            success: false,
            error: 'Failed to generate signed URLs',
            message: 'File uploaded but signed URL generation failed'
          });
        }
      });

      // Write file buffer to stream
      apiLogger.success(req, 'Starting file upload to GCS', {
        bucket: bucket.name,
        filename: safeName,
        bufferSize: req.file.buffer.length
      });

      stream.end(req.file.buffer);

    } catch (err) {
      apiLogger.error(req, 'Unexpected error during file upload', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }

  // Generate new signed URLs for existing files
  async generateSignedUrls(req: Request, res: Response): Promise<void> {
    const requestId = (req as any).requestId;

    try {
      apiLogger.success(req, 'Signed URL generation request received');

      const { filename } = req.params;

      if (!filename) {
        apiLogger.warn(req, 'No filename provided for signed URL generation');
        res.status(400).json({
          success: false,
          error: 'Filename required',
          message: 'Please provide a filename in the URL parameters'
        });
        return;
      }

      // Check if GCS bucket is configured
      if (!process.env.GCS_BUCKET) {
        apiLogger.error(req, 'GCS bucket not configured - GCS_BUCKET environment variable missing');
        res.status(500).json({
          success: false,
          error: 'GCS bucket not configured',
          message: 'GCS_BUCKET environment variable is not set'
        });
        return;
      }

      // Get file reference from bucket
      const file = bucket.file(filename);

      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        apiLogger.warn(req, 'File not found for signed URL generation', { filename });
        res.status(404).json({
          success: false,
          error: 'File not found',
          message: `File '${filename}' does not exist in the bucket`
        });
        return;
      }

      // Generate signed URLs
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour from now
        version: 'v4'
      });

      const [longTermSignedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        version: 'v4'
      });

      const result = {
        success: true,
        filename,
        url: signedUrl,
        longTermUrl: longTermSignedUrl,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        longTermExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };

      apiLogger.success(req, 'Signed URLs generated successfully', {
        filename,
        shortTermUrl: signedUrl,
        longTermUrl: longTermSignedUrl
      });

      res.status(200).json(result);

    } catch (err) {
      apiLogger.error(req, 'Error generating signed URLs', {
        error: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err instanceof Error ? err.message : 'Unknown error occurred'
      });
    }
  }
}

export default new UploadController();
