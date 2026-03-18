import OpenAI from 'openai';
import { config } from '../config/env.js';
import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export class RecommendationAgent {
  constructor() {
    this.name = 'RecommendationAgent';
  }

  async getRecommendation({ patientData, userRequest }) {
    const startTime = Date.now();

    try {
      // Step 1: Fetch patient's order history
      const orderHistory = await this.getPatientOrderHistory(patientData._id);

      // Step 2: Get available medicines that match the request
      const availableMedicines = await this.findRelevantMedicines(userRequest);

      // Step 3: Use AI to recommend the best option
      const recommendation = await this.performAIRecommendation({
        patientAge: patientData.age,
        patientName: patientData.name,
        medicalConditions: patientData.medicalConditions || [],
        orderHistory,
        availableMedicines,
        userRequest,
      });

      return {
        success: true,
        data: recommendation,
        reasoning: `Analyzed patient profile (age: ${patientData.age}) and ${orderHistory.length} previous orders`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('RecommendationAgent Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  async getPatientOrderHistory(patientId) {
    try {
      const orders = await Order.find({
        patientId,
        status: 'APPROVED',
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      // Extract medicine names from order history
      const medicines = [];
      orders.forEach(order => {
        order.items.forEach(item => {
          medicines.push({
            name: item.medicineName,
            quantity: item.quantity,
            date: order.createdAt,
          });
        });
      });

      return medicines;
    } catch (error) {
      console.error('Error fetching order history:', error.message);
      return [];
    }
  }

  async findRelevantMedicines(userRequest) {
    try {
      // Search for medicines that might be relevant to the request
      const allMedicines = await Medicine.find({ stockQty: { $gt: 0 } }).lean();
      
      // Return list of available medicines with details
      return allMedicines.map(med => ({
        name: med.name,
        price: med.price,
        stock: med.stockQty,
        prescriptionRequired: med.prescriptionRequired,
        unit: med.unit,
      }));
    } catch (error) {
      console.error('Error fetching medicines:', error.message);
      return [];
    }
  }

  async performAIRecommendation(context) {
    const previousMedicines = context.orderHistory
      .slice(0, 5)
      .map(m => m.name)
      .join(', ') || 'None';

    const medicineList = context.availableMedicines
      .slice(0, 20)
      .map(m => `- ${m.name} (₹${m.price}/${m.unit}, Stock: ${m.stock}, Prescription: ${m.prescriptionRequired ? 'Yes' : 'No'})`)
      .join('\n');

    const systemPrompt = `You are an intelligent pharmacy recommendation system. 

Your task is to recommend the MOST APPROPRIATE medicine based on:
1. Patient's age and health profile
2. Previous medication history
3. Available medicines in stock
4. Medical best practices

IMPORTANT RULES:
- For elderly patients (60+), prefer gentler medications with fewer side effects
- For children (<18), recommend age-appropriate dosages
- If patient has history with a specific medicine, prefer that (unless contraindicated)
- Consider prescription requirements
- Prioritize safety over cost

Patient Profile:
- Age: ${context.patientAge} years
- Previous Medicines: ${previousMedicines}
${context.medicalConditions.length > 0 ? `- Medical Conditions: ${context.medicalConditions.join(', ')}` : ''}

Available Medicines:
${medicineList}

User Request: "${context.userRequest}"

Provide recommendations in JSON format:
{
  "primaryRecommendation": {
    "medicineName": "...",
    "reason": "Why this is the best choice",
    "dosageAdvice": "Recommended dosage based on age"
  },
  "alternatives": [
    {
      "medicineName": "...",
      "reason": "Alternative option"
    }
  ],
  "warnings": ["Any important warnings or considerations"],
  "needsPrescription": true/false
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: `Please recommend appropriate medicine for: ${context.userRequest}`,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0].message.content);
      return result;
    } catch (error) {
      console.error('AI Recommendation error:', error.message);
      
      // Fallback: return simple recommendation
      return {
        primaryRecommendation: {
          medicineName: 'Unable to determine',
          reason: 'Please consult with pharmacist for personalized recommendation',
          dosageAdvice: 'As prescribed by doctor',
        },
        alternatives: [],
        warnings: ['Unable to process AI recommendation. Manual review required.'],
        needsPrescription: true,
      };
    }
  }
}
