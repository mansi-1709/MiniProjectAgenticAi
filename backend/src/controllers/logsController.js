import { ObservabilityAgent } from '../agents/index.js';

const observabilityAgent = new ObservabilityAgent();

/**
 * Logs Controller
 * Handles agent log retrieval
 */

// Get all agent logs
export const getAllLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await observabilityAgent.getAllLogs(limit);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch logs',
        error: result.error,
      });
    }
    
    res.json({
      success: true,
      count: result.data.length,
      logs: result.data,
    });
  } catch (error) {
    console.error('Get Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch logs',
      error: error.message,
    });
  }
};

// Get logs for specific order
export const getOrderLogs = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const result = await observabilityAgent.getOrderLogs(orderId);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch order logs',
        error: result.error,
      });
    }
    
    res.json({
      success: true,
      count: result.data.length,
      logs: result.data,
    });
  } catch (error) {
    console.error('Get Order Logs Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order logs',
      error: error.message,
    });
  }
};
