import nodemailer from 'nodemailer';
import axios from 'axios';
import { config } from '../config/env.js';


export class NotificationAgent {
  constructor() {
    this.name = 'NotificationAgent';
    this.emailTransporter = this.createEmailTransporter();
  }

  createEmailTransporter() {
    if (!config.email.host || !config.email.user) {
      console.log('⚠️  Email configuration not found, notifications will be logged only');
      return null;
    }

    return nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: false,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });
  }

  async sendNotification({ type, data }) {
    const startTime = Date.now();
    const results = {
      sent: false,
      channels: [],
    };

    try {
      // Prepare notification content based on type
      const notification = this.prepareNotification(type, data);

      // Send via Email
      if (this.emailTransporter) {
        try {
          await this.sendEmail(notification);
          results.channels.push({ channel: 'email', status: 'sent' });
        } catch (error) {
          console.error('Email notification failed:', error.message);
          results.channels.push({ channel: 'email', status: 'failed', error: error.message });
        }
      }

      // Send via Webhook
      if (config.webhookUrl) {
        try {
          await this.sendWebhook(notification);
          results.channels.push({ channel: 'webhook', status: 'sent' });
        } catch (error) {
          console.error('Webhook notification failed:', error.message);
          results.channels.push({ channel: 'webhook', status: 'failed', error: error.message });
        }
      }

      // Console log (always)
      console.log('📢 Notification:', notification);
      results.channels.push({ channel: 'console', status: 'logged' });

      results.sent = results.channels.some(c => c.status === 'sent' || c.status === 'logged');

      return {
        success: true,
        data: results,
        reasoning: `Notification sent via ${results.channels.length} channel(s)`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('NotificationAgent Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  prepareNotification(type, data) {
    switch (type) {
      case 'LOW_STOCK':
        return {
          subject: `⚠️ Low Stock Alert: ${data.medicineName}`,
          message: `
Medicine: ${data.medicineName}
Current Stock: ${data.currentStock}
Threshold: ${data.threshold}
Recommended Refill: ${data.recommendedRefillQty}
Urgency: ${data.urgency}

${data.reasoning}
          `.trim(),
          type: 'LOW_STOCK',
          data,
        };
      
      case 'ORDER_REJECTED':
        return {
          subject: `❌ Order Rejected`,
          message: `
Order for ${data.medicineName} (qty: ${data.quantity}) was rejected.
Reason: ${data.reason}
          `.trim(),
          type: 'ORDER_REJECTED',
          data,
        };
      
      case 'ORDER_APPROVED':
        return {
          subject: `✅ Order Approved`,
          message: `
Order successfully processed:
Medicine: ${data.medicineName}
Quantity: ${data.quantity}
Total: ₹${data.totalAmount}
          `.trim(),
          type: 'ORDER_APPROVED',
          data,
        };
      
      default:
        return {
          subject: 'Pharmacy Notification',
          message: JSON.stringify(data, null, 2),
          type,
          data,
        };
    }
  }

  async sendEmail(notification) {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    const mailOptions = {
      from: config.email.user,
      to: config.email.user, // In production, send to pharmacy admin
      subject: notification.subject,
      text: notification.message,
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  async sendWebhook(notification) {
    if (!config.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    await axios.post(config.webhookUrl, {
      text: notification.subject,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: notification.message,
          },
        },
      ],
    });
  }
}
