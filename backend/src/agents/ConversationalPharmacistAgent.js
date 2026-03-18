import OpenAI from 'openai';
import { config } from '../config/env.js';
import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';
import Patient from '../models/Patient.js';
import Prescription from '../models/Prescription.js';

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

/**
 * Conversational Pharmacist Agent
 * Purpose: Natural conversation with patients like a real pharmacist
 * - Analyzes symptoms and patient age
 * - Recommends medicines with dosage duration
 * - Shows patient medication history
 * - Enforces prescription requirements
 */
export class ConversationalPharmacistAgent {
  constructor() {
    this.name = 'ConversationalPharmacistAgent';
  }

  /**
   * Main conversation handler
   */
  async handleConversation({ message, patientId }) {
    const startTime = Date.now();

    try {
      // Get patient data
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return {
          success: false,
          error: 'Patient not found',
        };
      }

      // Get patient's medication history
      const medicationHistory = await this.getPatientMedicationHistory(patientId);

      // Get available medicines
      const availableMedicines = await this.getAvailableMedicines();

      // Use AI to analyze and recommend
      const aiResponse = await this.analyzeWithAI({
        message,
        patient,
        medicationHistory,
        availableMedicines,
      });

      // Process the AI response
      const result = await this.processResponse(aiResponse, patient);

      return {
        success: true,
        data: result,
        reasoning: `Analyzed patient (age: ${patient.age}), reviewed ${medicationHistory.length} previous orders`,
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('ConversationalPharmacistAgent Error:', error.message);
      return {
        success: false,
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Get patient's medication history
   */
  async getPatientMedicationHistory(patientId) {
    const orders = await Order.find({ patientId, status: 'APPROVED' })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return orders.map((order) => ({
      date: order.createdAt,
      medicines: order.items.map((item) => ({
        name: item.medicineName,
        quantity: item.quantity,
        dosageDuration: item.dosageDuration || 'Not specified',
      })),
    }));
  }

  /**
   * Get available medicines from inventory
   */
  async getAvailableMedicines() {
    const medicines = await Medicine.find({ stockQty: { $gt: 0 } })
      .select('name unit prescriptionRequired')
      .limit(30)
      .lean();

    return medicines.map((med) => ({
      name: med.name,
      unit: med.unit,
      needsPrescription: med.prescriptionRequired,
    }));
  }

  /**
   * AI Analysis using OpenAI GPT-4
   */
  async analyzeWithAI({ message, patient, medicationHistory, availableMedicines }) {
    const systemPrompt = `You are an expert pharmacist assistant helping patients get appropriate medicines.

PATIENT INFORMATION:
- Name: ${patient.name}
- Age: ${patient.age} years
- Medical Conditions: ${patient.medicalConditions?.join(', ') || 'None'}
- Allergies: ${patient.allergies?.join(', ') || 'None'}

PATIENT'S MEDICATION HISTORY (Last 10 orders):
${medicationHistory.length > 0 
  ? medicationHistory.map((order, i) => 
      `${i + 1}. Date: ${new Date(order.date).toLocaleDateString()}
   Medicines: ${order.medicines.map(m => `${m.name} (${m.quantity} units, ${m.dosageDuration})`).join(', ')}`
    ).join('\n')
  : 'No previous medication history'}

AVAILABLE MEDICINES IN STOCK:
${availableMedicines.slice(0, 20).map(med => 
  `- ${med.name} (${med.unit}) ${med.needsPrescription ? '[PRESCRIPTION REQUIRED ⚠️]' : '[Over-the-Counter]'}`
).join('\n')}

YOUR ROLE:
1. Understand patient's symptoms or request
2. Consider patient's AGE when recommending dosage
3. Check if patient wants previous medicine (refer to history)
4. Recommend appropriate medicine with complete dosage duration
5. ENFORCE prescription requirements strictly - DO NOT give prescription medicines without prescription

RESPONSE FORMAT (Return ONLY valid JSON):
{
  "conversationType": "symptom_based" | "previous_medicine" | "needs_clarification" | "prescription_required",
  "understanding": "Brief summary of patient's request",
  "recommendedMedicine": "Medicine name or null",
  "quantity": number or 0,
  "dosageDuration": "e.g., '1 tablet twice daily for 5 days'" or null,
  "totalDaysSupply": number of days or 0,
  "prescriptionRequired": true/false,
  "pharmacistMessage": "Friendly message to patient",
  "followUpQuestions": ["question1"] or null,
  "warnings": ["warning1"] or null,
  "ageConsideration": "How age affected the recommendation"
}

EXAMPLES:

Example 1 - Symptom-based (Adult):
Input: "I have fever and headache for 3 days"
Patient Age: 35
Output: {
  "conversationType": "symptom_based",
  "understanding": "Patient has fever and headache for 3 days",
  "recommendedMedicine": "Paracetamol",
  "quantity": 15,
  "dosageDuration": "1 tablet 3 times daily after meals for 5 days",
  "totalDaysSupply": 5,
  "prescriptionRequired": false,
  "pharmacistMessage": "For your fever and headache, I recommend Paracetamol. Take 1 tablet 3 times daily after meals for 5 days. If fever persists beyond 3 days or exceeds 102°F, please consult a doctor immediately.",
  "followUpQuestions": null,
  "warnings": ["Consult doctor if fever persists beyond 3 days", "Do not exceed 4000mg per day"],
  "ageConsideration": "Adult dosage: 500mg tablets appropriate"
}

Example 2 - Previous Medicine Request:
Input: "Give me the medicine I took last time"
Output: {
  "conversationType": "previous_medicine",
  "understanding": "Patient wants to repeat previous medication",
  "recommendedMedicine": "Paracetamol",
  "quantity": 10,
  "dosageDuration": "1 tablet twice daily for 5 days",
  "totalDaysSupply": 5,
  "prescriptionRequired": false,
  "pharmacistMessage": "Based on your history, you previously took Paracetamol. Would you like the same?",
  "followUpQuestions": ["Are you experiencing the same symptoms?"],
  "warnings": null,
  "ageConsideration": "Same dosage as previous order"
}

Example 3 - Prescription Required:
Input: "I need antibiotics"
Output: {
  "conversationType": "prescription_required",
  "understanding": "Patient requesting antibiotics",
  "recommendedMedicine": "Amoxicillin",
  "quantity": 0,
  "dosageDuration": null,
  "totalDaysSupply": 0,
  "prescriptionRequired": true,
  "pharmacistMessage": "Antibiotics like Amoxicillin require a valid doctor's prescription. I cannot dispense this medicine without a prescription. Do you have a prescription from your doctor?",
  "followUpQuestions": ["Do you have a valid prescription?"],
  "warnings": ["Antibiotics should NEVER be taken without doctor consultation", "Improper use can cause antibiotic resistance"],
  "ageConsideration": "Prescription required regardless of age"
}

IMPORTANT RULES:
- Always consider patient AGE for dosage
- For children (<12): Recommend pediatric formulations
- For elderly (>65): Consider reduced dosage
- NEVER give prescription medicines without valid prescription
- Check medication history to avoid repetition
- Provide clear dosage duration (e.g., "5 days", "7 days")
- Include safety warnings

BE PROFESSIONAL, HELPFUL, AND SAFETY-FOCUSED.

CRITICAL: Your response must be ONLY valid JSON. Do not include any explanation or text before or after the JSON.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content.trim();
    
    // Extract JSON if there's any extra text
    let jsonContent = content;
    if (content.includes('{')) {
      const startIndex = content.indexOf('{');
      const endIndex = content.lastIndexOf('}') + 1;
      jsonContent = content.substring(startIndex, endIndex);
    }
    
    try {
      return JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Received content:', content);
      
      // Fallback response
      return {
        conversationType: 'needs_clarification',
        understanding: 'Unable to process request',
        recommendedMedicine: null,
        quantity: 0,
        dosageDuration: null,
        totalDaysSupply: 0,
        prescriptionRequired: false,
        pharmacistMessage: 'I apologize, but I need more information to help you. Could you please describe your symptoms or medical needs more clearly?',
        followUpQuestions: ['What symptoms are you experiencing?'],
        warnings: null,
        ageConsideration: 'N/A'
      };
    }
  }

  /**
   * Process AI response and determine action
   */
  async processResponse(aiData, patient) {
    // Case 1: Needs clarification
    if (aiData.conversationType === 'needs_clarification') {
      return {
        type: 'CLARIFICATION_NEEDED',
        message: aiData.pharmacistMessage,
        questions: aiData.followUpQuestions,
      };
    }

    // Case 2: Prescription required
    if (aiData.prescriptionRequired && aiData.conversationType === 'prescription_required') {
      // Check if patient has active prescription
      const hasPrescription = await this.checkPrescription(
        patient._id,
        aiData.recommendedMedicine
      );

      if (!hasPrescription) {
        return {
          type: 'PRESCRIPTION_REQUIRED',
          message: aiData.pharmacistMessage,
          medicine: aiData.recommendedMedicine,
          warnings: aiData.warnings,
          prescriptionMessage: 'This medicine requires a valid doctor prescription. Please provide prescription to proceed.',
        };
      }
    }

    // Case 3: Ready to proceed with order
    return {
      type: 'ORDER_READY',
      medicine: aiData.recommendedMedicine,
      quantity: aiData.quantity,
      dosageDuration: aiData.dosageDuration,
      totalDaysSupply: aiData.totalDaysSupply,
      message: aiData.pharmacistMessage,
      warnings: aiData.warnings,
      prescriptionRequired: aiData.prescriptionRequired,
      conversationSummary: aiData.understanding,
      ageConsideration: aiData.ageConsideration,
    };
  }

  /**
   * Check if patient has active prescription for medicine
   */
  async checkPrescription(patientId, medicineName) {
    const prescription = await Prescription.findOne({
      patientId,
      active: true,
      'medicines.medicineName': medicineName,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    });

    return prescription !== null;
  }
}
