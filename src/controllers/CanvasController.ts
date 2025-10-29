import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import canvasModel from '../models/CanvasDesign';
import canvasAccessModel from '../models/CanvasAccess';
import userModel from '../models/User';
import commentModel from '../models/Comment';

class CanvasController {
  async saveCanvas(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { designData, metadata, imageUrl, layerNames } = req.body;
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

      // Validate optional layerNames
      if (layerNames !== undefined) {
        const isValidArray = Array.isArray(layerNames) && layerNames.every((n: any) => typeof n === 'string');
        if (!isValidArray) {
          res.status(400).json({
            success: false,
            error: 'Invalid layerNames',
            message: 'layerNames must be an array of strings',
          });
          return;
        }
      }

      const canvas = await canvasModel.save(id, userId, designData, imageUrl, metadata || {}, layerNames);

      res.status(201).json({
        success: true,
        id: canvas._id,
        message: 'Canvas design saved successfully',
        data: {
          id: canvas._id,
          createdAt: canvas.metadata.createdAt,
          updatedAt: canvas.metadata.updatedAt,
          layerNames: canvas.layerNames || [],
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
      const hasAccess = await canvasAccessModel.hasAccess(id, userId, 'viewer');
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
          imageUrl: canvas.imageUrl,
          designData: canvas.designData,
          metadata: canvas.metadata,
          layerNames: canvas.layerNames || [],
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

      const { data, total } = await canvasModel.findUserAccessibleCanvases(userId, limit, offset);

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
      const { designData, metadata, imageUrl, layerNames } = req.body;
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
      const hasAccess = await canvasAccessModel.hasAccess(id, userId, 'editor');
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

      // Validate optional layerNames
      if (layerNames !== undefined) {
        const isValidArray = Array.isArray(layerNames) && layerNames.every((n: any) => typeof n === 'string');
        if (!isValidArray) {
          res.status(400).json({
            success: false,
            error: 'Invalid layerNames',
            message: 'layerNames must be an array of strings',
          });
          return;
        }
      }

      const canvas = await canvasModel.save(id, userId, designData, imageUrl, metadata || {}, layerNames);

      res.status(200).json({
        success: true,
        id: canvas._id,
        message: 'Canvas design updated successfully',
        data: {
          id: canvas._id,
          createdAt: canvas.metadata.createdAt,
          updatedAt: canvas.metadata.updatedAt,
          layerNames: canvas.layerNames || [],
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
      const hasAccess = await canvasAccessModel.hasAccess(canvasId, currentUserId, 'editor');
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

  async shareCanvasWithMultipleUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { canvasId, userIds, role = 'editor' } = req.body;
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
      if (!canvasId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Invalid input',
          message: 'Canvas ID and array of User IDs are required',
        });
        return;
      }

      // Validate role
      if (!['owner', 'editor', 'viewer'].includes(role)) {
        res.status(400).json({
          success: false,
          error: 'Invalid role',
          message: 'Role must be one of: owner, editor, viewer',
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
      const hasAccess = await canvasAccessModel.hasAccess(canvasId, currentUserId, 'editor');
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have permission to share this canvas',
        });
        return;
      }

      const results: Array<{ userId: string; role: string; grantedAt: Date }> = [];
      const errors: Array<{ userId: string; error: string }> = [];

      // Process each user ID
      for (const userId of userIds) {
        try {
          // Check if user exists
          const user = await userModel.findById(userId);
          if (!user) {
            errors.push({
              userId,
              error: 'User not found'
            });
            continue;
          }

          // Grant access to the user
          const access = await canvasAccessModel.grantAccess(canvasId, userId, role, currentUserId);
          results.push({
            userId: access.userId,
            role: access.role,
            grantedAt: access.grantedAt,
          });
        } catch (error: any) {
          errors.push({
            userId,
            error: error.message
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Canvas access granted to ${results.length} users`,
        data: {
          canvasId,
          successful: results,
          failed: errors,
          totalProcessed: userIds.length,
          successCount: results.length,
          errorCount: errors.length,
        },
      });
    } catch (error: any) {
      console.error('Error sharing canvas with multiple users:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const currentUserId = req.user?.userId;

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User authentication required',
        });
        return;
      }

      // Get query parameters for pagination
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;

      // Build query for user search
      let query: any = {};
      if (search) {
        query = {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ]
        };
      }

      // Get users from database
      const users = await userModel.findUsers(query, limit, offset);

      res.status(200).json({
        success: true,
        data: users.data,
        pagination: {
          total: users.total,
          limit,
          offset,
        },
        search: search || null,
      });
    } catch (error: any) {
      console.error('Error getting all users:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async saveComment(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { canvasId } = req.params;
      const { id, authorId, timestamp, text } = req.body;
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
      if (!id || !authorId || !timestamp || !text) {
        res.status(400).json({
          success: false,
          error: 'Invalid comment data',
          message: 'Comment must have id, authorId, timestamp, and text',
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

      // Check if user has access to this canvas
      const hasAccess = await canvasAccessModel.hasAccess(canvasId, userId, 'viewer');
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have access to this canvas',
        });
        return;
      }

      const savedComment = await commentModel.saveComment(canvasId, {
        id,
        authorId,
        timestamp,
        text,
      });

      res.status(201).json({
        success: true,
        message: 'Comment saved successfully',
        data: {
          canvasId,
          comment: savedComment,
        },
      });
    } catch (error: any) {
      console.error('Error saving comment:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  async getComments(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { canvasId } = req.params;
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
      const canvas = await canvasModel.findById(canvasId);
      if (!canvas) {
        res.status(404).json({
          success: false,
          error: 'Not found',
          message: `Canvas design with id '${canvasId}' not found`,
        });
        return;
      }

      // Check if user has access to this canvas
      const hasAccess = await canvasAccessModel.hasAccess(canvasId, userId, 'viewer');
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'You do not have access to this canvas',
        });
        return;
      }

      const comments = await commentModel.getCommentsByCanvasId(canvasId);

      res.status(200).json({
        success: true,
        data: {
          canvasId,
          comments,
          count: comments.length,
        },
      });
    } catch (error: any) {
      console.error('Error getting comments:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new CanvasController();

