import express from 'express';
import { InventoryNLPAgent } from '../agents/InventoryNLPAgent.js';
import { protect, authorize } from '../middleware/auth.js';
import { ObservabilityAgent } from '../agents/ObservabilityAgent.js';

const router = express.Router();
const inventoryNLPAgent = new InventoryNLPAgent();
const observabilityAgent = new ObservabilityAgent();

/**
 * POST /api/inventory-agent/update
 * Processes a natural language inventory command
 * Accessible by pharmacist + admin
 */
router.post(
  '/update',
  protect,
  authorize('pharmacist', 'admin', 'super_admin'),
  async (req, res) => {
    try {
      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Message is required.',
        });
      }

      const result = await inventoryNLPAgent.processCommand(message.trim());

      // Log agent execution
      try {
        await observabilityAgent.logAgentExecution({
          agentName: 'InventoryNLPAgent',
          input: { message },
          output: result,
          reasoning: result.success
            ? `Processed: ${result.action} ${result.quantityChanged} of ${result.medicineName}`
            : `Failed: ${result.message}`,
          executionTimeMs: result.executionTimeMs,
        });
      } catch (logErr) {
        // Non-critical
      }

      res.json(result);
    } catch (error) {
      console.error('Inventory Agent Route Error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error processing inventory command.',
        error: error.message,
      });
    }
  }
);

export default router;
