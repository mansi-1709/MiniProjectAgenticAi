import app from './app.js';
import { connectDB } from './config/database.js';
import { config, validateConfig } from './config/env.js';

// Validate environment variables
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

// Connect to MongoDB
connectDB();

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   🏥 AI PHARMACY MANAGEMENT SYSTEM 🤖    ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Backend URL: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log('\n✨ AI Agents loaded and ready!');
  console.log('   • Ordering Agent');
  console.log('   • Safety Agent');
  console.log('   • Inventory Refill Agent');
  console.log('   • Notification Agent');
  console.log('   • Observability Agent');
  console.log('\n⏳ Waiting for requests...\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

// Handle SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});
