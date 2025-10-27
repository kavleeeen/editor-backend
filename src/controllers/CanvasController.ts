import { Request, Response } from 'express';
import canvasModel from '../models/CanvasDesign';

class CanvasController {
  async saveCanvas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { designData, metadata } = req.body;

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

      const canvas = await canvasModel.save(id, designData, metadata || {});

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

  async getCanvas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const canvas = await canvasModel.findById(id);

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

  async listCanvases(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const { data, total } = await canvasModel.findAll(limit, offset);

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

  async deleteCanvas(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await canvasModel.delete(id);

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
}

export default new CanvasController();

