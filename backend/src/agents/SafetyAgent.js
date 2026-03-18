import OpenAI from 'openai';
import { config } from '../config/env.js';
import Medicine from '../models/Medicine.js';
import Prescription from '../models/Prescription.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});


export class SafetyAgent {
  constructor() {
    this.name = 'SafetyAgent';
  }

  async validateOrder({ medicineName, quantity, patientId }) {
    const startTime = Date.now();
    
    try {
      // Step 1: Check if medicine exists
      const medicine = await Medicine.findOne({ 
        name: { $regex: new RegExp(`^${medicineName}$`, 'i') }
      });
      
      if (!medicine) {
        return {
          success: true,
          data: {
            status: 'REJECTED',
            reason: `Medicine "${medicineName}" not found in inventory`,
          },
          reasoning: 'Medicine does not exist in database',
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Step 2: Check stock availability
      if (medicine.stockQty < quantity) {
        return {
          success: true,
          data: {
            status: 'REJECTED',
            reason: `Insufficient stock. Available: ${medicine.stockQty}, Requested: ${quantity}`,
          },
          reasoning: `Stock check failed: ${medicine.stockQty} < ${quantity}`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Step 3: Check prescription requirement
      if (medicine.prescriptionRequired) {
        const prescription = await Prescription.findOne({
          patientId,
          active: true,
          'medicines.medicineName': { $regex: new RegExp(`^${medicineName}$`, 'i') },
        });

        if (!prescription) {
          return {
            success: true,
            data: {
              status: 'REJECTED',
              reason: `${medicineName} requires a valid prescription`,
            },
            reasoning: 'Prescription required but not found',
            executionTimeMs: Date.now() - startTime,
          };
        }
      }

      // Step 4: Use AI for additional safety validation
      const aiValidation = await this.performAIValidation({
        medicineName: medicine.name,
        quantity,
        stockQty: medicine.stockQty,
        prescriptionRequired: medicine.prescriptionRequired,
      });

      if (!aiValidation.approved) {
        return {
          success: true,
          data: {
            status: 'REJECTED',
            reason: aiValidation.reason,
          },
          reasoning: aiValidation.reasoning,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // All checks passed
      return {
        success: true,
        data: {
          status: 'APPROVED',
          reason: 'Order validated successfully',
          medicine: {
            id: medicine._id,
            name: medicine.name,
            unit: medicine.unit,
            price: medicine.price,
            stockQty: medicine.stockQty,
          },
        },
        reasoning: `All validations passed for ${quantity} ${medicine.name}`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('SafetyAgent Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        reasoning: 'Safety validation failed due to error',
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  async performAIValidation(orderDetails) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a pharmacy safety validator. Analyze orders for safety concerns.

Check for:
- Unusual quantities (>100 of any medicine is suspicious unless it's a bulk order)
- Reasonable dosage amounts

Return JSON:
{
  "approved": boolean,
  "reason": "explanation",
  "reasoning": "detailed analysis"
}

Always err on the side of approval unless there's a clear safety issue.`
          },
          {
            role: 'user',
            content: JSON.stringify(orderDetails)
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('AI Validation Error:', error.message);
      // Default to approval if AI check fails
      return {
        approved: true,
        reason: 'AI validation unavailable, proceeding with manual checks',
        reasoning: 'Fallback to basic validation',
      };
    }
  }
}
