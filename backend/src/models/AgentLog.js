import mongoose from 'mongoose';

const agentLogSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  agentName: {
    type: String,
    required: true,
    enum: [
      'OrderingAgent',
      'SafetyAgent',
      'InventoryRefillAgent',
      'NotificationAgent',
      'ObservabilityAgent',
    ],
  },
  input: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  output: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  reasoning: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  executionTimeMs: {
    type: Number,
  },
});

// Index for faster queries
agentLogSchema.index({ orderId: 1, timestamp: -1 });
agentLogSchema.index({ agentName: 1, timestamp: -1 });

export default mongoose.model('AgentLog', agentLogSchema);
