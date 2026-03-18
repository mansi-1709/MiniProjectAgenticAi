import OpenAI from 'openai';
import { config } from '../config/env.js';
import Medicine from '../models/Medicine.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Inventory Refill Agent
 * Purpose: Monitor stock levels and generate refill alerts
 * Input: { medicineId }
 * Output: { alertRequired: boolean, alertData: object }
 */
export class InventoryRefillAgent {
  constructor() {
    this.name = 'InventoryRefillAgent';
  }

  async checkInventory(medicineId) {
    const startTime = Date.now();
    
    try {
      const medicine = await Medicine.findById(medicineId);
      
      if (!medicine) {
        return {
          success: false,
          error: 'Medicine not found',
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Check if stock is below threshold
      const isLowStock = medicine.stockQty <= medicine.minStockThreshold;
      
      if (!isLowStock) {
        return {
          success: true,
          data: {
            alertRequired: false,
            currentStock: medicine.stockQty,
            threshold: medicine.minStockThreshold,
          },
          reasoning: `Stock level ${medicine.stockQty} is above threshold ${medicine.minStockThreshold}`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Use AI to generate smart refill recommendations
      const aiRecommendation = await this.generateRefillRecommendation(medicine);

      return {
        success: true,
        data: {
          alertRequired: true,
          alertData: {
            medicineName: medicine.name,
            currentStock: medicine.stockQty,
            threshold: medicine.minStockThreshold,
            recommendedRefillQty: aiRecommendation.recommendedQty,
            urgency: aiRecommendation.urgency,
            reasoning: aiRecommendation.reasoning,
          },
        },
        reasoning: `Low stock detected: ${medicine.stockQty} <= ${medicine.minStockThreshold}`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('InventoryRefillAgent Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  async generateRefillRecommendation(medicine) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an inventory management assistant for a pharmacy.
            
Analyze the medicine stock and provide refill recommendations.

Consider:
- Current stock level
- Minimum threshold
- Medicine type and typical usage
- Urgency level (LOW, MEDIUM, HIGH, CRITICAL)

Return JSON:
{
  "recommendedQty": number,
  "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "reasoning": "explanation"
}

Guidelines:
- If stock is 0: CRITICAL urgency, recommend 3x threshold
- If stock is 1-25% of threshold: HIGH urgency, recommend 2x threshold
- If stock is 26-50% of threshold: MEDIUM urgency, recommend 1.5x threshold
- If stock is 51-100% of threshold: LOW urgency, recommend threshold amount`
          },
          {
            role: 'user',
            content: JSON.stringify({
              medicineName: medicine.name,
              currentStock: medicine.stockQty,
              minThreshold: medicine.minStockThreshold,
              unit: medicine.unit,
            })
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('AI Recommendation Error:', error.message);
      
      // Fallback logic
      const percentage = (medicine.stockQty / medicine.minStockThreshold) * 100;
      let urgency = 'MEDIUM';
      let multiplier = 2;
      
      if (medicine.stockQty === 0) {
        urgency = 'CRITICAL';
        multiplier = 3;
      } else if (percentage <= 25) {
        urgency = 'HIGH';
        multiplier = 2.5;
      } else if (percentage <= 50) {
        urgency = 'MEDIUM';
        multiplier = 2;
      } else {
        urgency = 'LOW';
        multiplier = 1.5;
      }
      
      return {
        recommendedQty: Math.ceil(medicine.minStockThreshold * multiplier),
        urgency,
        reasoning: `Fallback calculation based on ${percentage.toFixed(1)}% of threshold`,
      };
    }
  }
}
