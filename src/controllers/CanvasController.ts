import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import canvasModel from '../models/CanvasDesign';

class CanvasController {
  async saveCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { designData, metadata } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      // Validate inputs
      if (!designData) {
        res.status(400).json({
          success: false,
          error: 'Invalid design data',
          message: 'Design data is required',
        });
        return;
      }

      // Validate designData structure
      if (typeof designData !== 'object' || !designData.version || !Array.isArray(designData.objects)) {
        res.status(400).json({
          success: false,
          error: 'Invalid design data',
          message: 'Design data validation failed',
        });
        return;
      }

      const canvas = await canvasModel.save(id, userId, designData, metadata || {});

      res.status(201).json({
        success: true,
        id: canvas._id,
        message: 'Canvas design saved successfully',
        data: {
          id: canvas._id,
          createdAt: canvas.metadata.createdAt,
          updatedAt: canvas.metadata.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error saving canvas:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      const canvas = await canvasModel.findById(id, userId);

      if (!canvas) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Canvas design with id '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        id: canvas._id,
        data: {
          id: canvas._id,
          designData: canvas.designData,
          metadata: canvas.metadata,
        },
      });
    } catch (error: any) {
      console.error('Error getting canvas:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async listCanvases(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      const { data, total } = await canvasModel.findAll(limit, offset, userId);

      res.status(200).json({
        success: true,
        data,
        pagination: {
          total,
          limit,
          offset,
        },
      });
    } catch (error: any) {
      console.error('Error listing canvases:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async deleteCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      const deleted = await canvasModel.delete(id, userId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Canvas design with id '${id}' not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Canvas design deleted successfully',
      });
    } catch (error: any) {
      console.error('Error deleting canvas:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async createBlankCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      const { metadata } = req.body;

      const canvas = await canvasModel.createBlank(userId, metadata);

      res.status(201).json({
        success: true,
        message: 'Blank canvas created successfully',
        data: {
          id: canvas._id,
          designData: canvas.designData,
          metadata: canvas.metadata,
        },
      });
    } catch (error: any) {
      console.error('Error creating blank canvas:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async updateCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { designData, metadata } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      // Check if canvas exists and belongs to user
      const existingCanvas = await canvasModel.findById(id, userId);
      if (!existingCanvas) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Canvas design with id '${id}' not found`,
        });
        return;
      }

      // Validate inputs
      if (!designData) {
        res.status(400).json({
          success: false,
          error: 'Invalid design data',
          message: 'Design data is required',
        });
        return;
      }

      // Validate designData structure
      if (typeof designData !== 'object' || !designData.version || !Array.isArray(designData.objects)) {
        res.status(400).json({
          success: false,
          error: 'Invalid design data',
          message: 'Design data validation failed',
        });
        return;
      }

      const canvas = await canvasModel.save(id, userId, designData, metadata || {});

      res.status(200).json({
        success: true,
        id: canvas._id,
        message: 'Canvas design updated successfully',
        data: {
          id: canvas._id,
          createdAt: canvas.metadata.createdAt,
          updatedAt: canvas.metadata.updatedAt,
        },
      });
    } catch (error: any) {
      console.error('Error updating canvas:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new CanvasController();

