import OpenAI from 'openai';
import { config } from '../config/env.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});


export class OrderingAgent {
  constructor() {
    this.name = 'OrderingAgent';
  }

  async extractOrder(naturalLanguageInput) {
    const startTime = Date.now();
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a pharmacy ordering assistant. Extract medicine name and quantity from natural language.
            
Rules:
- Extract the medicine name (capitalize first letter)
- Extract the quantity as a number
- If quantity is not mentioned, use 1
- If medicine name is unclear, ask for clarification
- Return ONLY valid JSON

Output format:
{
  "medicineName": "MedicineName",
  "quantity": number
}

Examples:
Input: "Give 10 Paracetamol to patient"
Output: {"medicineName": "Paracetamol", "quantity": 10}

Input: "I need Aspirin"
Output: {"medicineName": "Aspirin", "quantity": 1}

Input: "Provide 5 tablets of Amoxicillin"
Output: {"medicineName": "Amoxicillin", "quantity": 5}`
          },
          {
            role: 'user',
            content: naturalLanguageInput
          }
        ],
        temperature: 0.3,
      });

      const executionTimeMs = Date.now() - startTime;
      const result = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        data: result,
        reasoning: `Extracted order from: "${naturalLanguageInput}"`,
        executionTimeMs,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      console.error('OrderingAgent Error:', error.message);
      
      return {
        success: false,
        error: error.message,
        reasoning: 'Failed to parse order from natural language',
        executionTimeMs,
      };
    }
  }
}
