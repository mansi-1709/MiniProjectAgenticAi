import AgentLog from '../models/AgentLog.js';


export class ObservabilityAgent {
  constructor() {
    this.name = 'ObservabilityAgent';
  }

  async logAgentExecution({ orderId, agentName, input, output, reasoning, executionTimeMs }) {
    const startTime = Date.now();
    
    try {
      const log = new AgentLog({
        orderId,
        agentName,
        input,
        output: output || { error: 'No output provided' },
        reasoning,
        executionTimeMs,
      });

      await log.save();

      return {
        success: true,
        data: {
          logged: true,
          logId: log._id.toString(),
        },
        reasoning: `Logged execution of ${agentName}`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('ObservabilityAgent Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  async getOrderLogs(orderId) {
    try {
      const logs = await AgentLog.find({ orderId }).sort({ timestamp: 1 });
      
      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      console.error('Error fetching logs:', error.message);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getAllLogs(limit = 100) {
    try {
      const logs = await AgentLog.find()
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('orderId');
      
      return {
        success: true,
        data: logs,
      };
    } catch (error) {
      console.error('Error fetching all logs:', error.message);
      
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
