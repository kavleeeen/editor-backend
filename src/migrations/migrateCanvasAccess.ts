import canvasModel from '../models/CanvasDesign';
import canvasAccessModel from '../models/CanvasAccess';

/**
 * Migration script to grant owner access to existing canvas designs
 * This should be run once after deploying the new access system
 */
export async function migrateExistingCanvases(): Promise<void> {
  try {
    console.log('🔄 Starting migration of existing canvas designs...');

    // Get all existing canvas designs
    const { data: canvases } = await canvasModel.findAll(1000, 0); // Get all canvases

    console.log(`📊 Found ${canvases.length} existing canvas designs to migrate`);

    let migratedCount = 0;

    for (const canvas of canvases) {
      // Check if access record already exists
      const existingAccess = await canvasAccessModel.getUserAccess(canvas.userId);
      const hasAccess = existingAccess.some(access => access.canvasId === canvas._id);

      if (!hasAccess) {
        // Grant owner access to the original creator
        await canvasAccessModel.grantAccess(canvas._id, canvas.userId, 'owner', canvas.userId);
        migratedCount++;
        console.log(`✓ Migrated canvas ${canvas._id} for user ${canvas.userId}`);
      } else {
        console.log(`- Canvas ${canvas._id} already has access records`);
      }
    }

    console.log(`✅ Migration completed! Migrated ${migratedCount} canvas designs`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Export for manual execution if needed
export default migrateExistingCanvases;
