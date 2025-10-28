import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import canvasModel from '../models/CanvasDesign';
import canvasAccessModel from '../models/CanvasAccess';

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

      const canvas = await canvasModel.findById(id);
      if (!canvas) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Canvas design with id '${id}' not found`,
        });
        return;
      }

      // Check if user has access to this canvas
      let hasAccess = await canvasAccessModel.hasAccess(id, userId, 'viewer');

      // Self-heal: if requester is the creator but lacks an access record, grant owner
      if (!hasAccess && canvas.userId === userId) {
        await canvasAccessModel.grantAccess(id, userId, 'owner', userId);
        hasAccess = true;
      }

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have access to this canvas',
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

      console.log('[listCanvases] Start', { userId, limit, offset });
      const { data, total } = await canvasModel.findUserAccessibleCanvases(userId, limit, offset);
      console.log('[listCanvases] Result', {
        userId,
        total,
        returned: data.length,
        canvasIds: data.map(c => c._id),
      });

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

      // Check if canvas exists
      const canvas = await canvasModel.findById(id);
      if (!canvas) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Canvas design with id '${id}' not found`,
        });
        return;
      }

      // Check if user has owner access to delete this canvas
      const hasAccess = await canvasAccessModel.hasAccess(id, userId, 'owner');
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to delete this canvas',
        });
        return;
      }

      const deleted = await canvasModel.delete(id);

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

      // Check if canvas exists
      const existingCanvas = await canvasModel.findById(id);
      if (!existingCanvas) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Canvas design with id '${id}' not found`,
        });
        return;
      }

      // Check if user has editor access to this canvas
      let hasAccess = await canvasAccessModel.hasAccess(id, userId, 'editor');

      // Self-heal: if requester is the creator but lacks an access record, grant owner
      if (!hasAccess && existingCanvas.userId === userId) {
        await canvasAccessModel.grantAccess(id, userId, 'owner', userId);
        hasAccess = true;
      }

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to edit this canvas',
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

  async shareCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { canvasId, userId } = req.body;
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      // Validate inputs
      if (!canvasId || !userId) {
        res.status(400).json({
          success: false,
          error: 'Invalid input',
          message: 'Canvas ID and User ID are required',
        });
        return;
      }

      // Check if canvas exists
      const canvas = await canvasModel.findById(canvasId);
      if (!canvas) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Canvas design with id '${canvasId}' not found`,
        });
        return;
      }

      // Check if current user has owner or editor access to share
      let hasAccess = await canvasAccessModel.hasAccess(canvasId, currentUserId, 'editor');

      // Self-heal: if requester is the creator but lacks an access record, grant owner
      if (!hasAccess && canvas.userId === currentUserId) {
        await canvasAccessModel.grantAccess(canvasId, currentUserId, 'owner', currentUserId);
        hasAccess = true;
      }
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to share this canvas',
        });
        return;
      }

      // Grant access to the specified user (default role: editor)
      const access = await canvasAccessModel.grantAccess(canvasId, userId, 'editor', currentUserId);

      res.status(200).json({
        success: true,
        message: 'Canvas access granted successfully',
        data: {
          canvasId: access.canvasId,
          userId: access.userId,
          role: access.role,
          grantedAt: access.grantedAt,
        },
      });
    } catch (error: any) {
      console.error('Error sharing canvas:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new CanvasController();

