import OpenAI from 'openai';
import { config } from '../config/env.js';
import Medicine from '../models/Medicine.js';

const openai = new OpenAI({ apiKey: config.openaiApiKey });

/**
 * Inventory NLP Agent
 * Parses natural language commands like "add 10 paracetamol in stock"
 * and updates the medicine inventory accordingly.
 */
export class InventoryNLPAgent {
  constructor() {
    this.name = 'InventoryNLPAgent';
  }

  async processCommand(message) {
    const startTime = Date.now();

    try {
      // Step 1: Parse the intent with AI
      const parsed = await this.parseIntent(message);

      if (!parsed || !parsed.medicineName || !parsed.action) {
        return {
          success: false,
          message: "I couldn't understand that command. Try: 'add 20 paracetamol to stock' or 'set ibuprofen stock to 50'.",
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Step 2: Find the medicine by name (fuzzy)
      const medicine = await this.findMedicine(parsed.medicineName);

      if (!medicine) {
        return {
          success: false,
          message: `Medicine "${parsed.medicineName}" not found in inventory. Please check the name and try again.`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      // Step 3: Apply the stock change
      let newQty;
      const oldQty = medicine.stockQty;

      if (parsed.action === 'add') {
        newQty = oldQty + parsed.quantity;
      } else if (parsed.action === 'subtract') {
        newQty = Math.max(0, oldQty - parsed.quantity);
      } else if (parsed.action === 'set') {
        newQty = parsed.quantity;
      } else {
        return {
          success: false,
          message: `Unknown action "${parsed.action}". Use add, remove, or set.`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      medicine.stockQty = newQty;
      await medicine.save();

      const isLowStock = newQty <= medicine.minStockThreshold;

      return {
        success: true,
        medicineName: medicine.name,
        action: parsed.action,
        quantityChanged: parsed.quantity,
        oldStock: oldQty,
        newStock: newQty,
        isLowStock,
        message: this.buildMessage(medicine.name, parsed.action, parsed.quantity, oldQty, newQty, isLowStock),
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('InventoryNLPAgent Error:', error.message);
      return {
        success: false,
        message: 'An error occurred while processing inventory command.',
        error: error.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  async parseIntent(message) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an inventory command parser for a pharmacy system.
Parse the user's natural language command and extract:
- action: "add" (increase stock), "subtract" (reduce stock), or "set" (set absolute quantity)
- quantity: a positive integer
- medicineName: the medicine name as mentioned

Common patterns:
- "add 10 paracetamol" → action: add, quantity: 10, medicineName: paracetamol
- "add 20 crocin in stock" → action: add, quantity: 20, medicineName: crocin
- "remove 5 ibuprofen" → action: subtract, quantity: 5, medicineName: ibuprofen
- "set paracetamol to 100" → action: set, quantity: 100, medicineName: paracetamol
- "paracetamol stock 50" → action: set, quantity: 50, medicineName: paracetamol
- "restock 30 amoxicillin" → action: add, quantity: 30, medicineName: amoxicillin

Return ONLY valid JSON:
{ "action": "add"|"subtract"|"set", "quantity": number, "medicineName": "string" }

If you cannot parse, return: { "action": null, "quantity": 0, "medicineName": null }`
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('InventoryNLPAgent ParseIntent Error:', error.message);

      // Fallback: simple regex parsing
      return this.regexParse(message);
    }
  }

  regexParse(message) {
    const lower = message.toLowerCase().trim();

    // Patterns: "add N <medicine>", "restock N <medicine>", "set <medicine> to N"
    const addMatch = lower.match(/(?:add|restock|receive|stock)\s+(\d+)\s+(.+?)(?:\s+(?:in|to|into)\s+stock)?$/);
    const subMatch = lower.match(/(?:remove|subtract|reduce|use)\s+(\d+)\s+(.+)/);
    const setMatch = lower.match(/(?:set|update)\s+(.+?)\s+(?:to|stock)\s+(\d+)/);

    if (addMatch) {
      return { action: 'add', quantity: parseInt(addMatch[1]), medicineName: addMatch[2].trim() };
    }
    if (subMatch) {
      return { action: 'subtract', quantity: parseInt(subMatch[1]), medicineName: subMatch[2].trim() };
    }
    if (setMatch) {
      return { action: 'set', quantity: parseInt(setMatch[2]), medicineName: setMatch[1].trim() };
    }

    return { action: null, quantity: 0, medicineName: null };
  }

  async findMedicine(name) {
    // Try exact match first (case-insensitive)
    let medicine = await Medicine.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });

    if (!medicine) {
      // Try partial match
      medicine = await Medicine.findOne({ name: { $regex: new RegExp(name, 'i') } });
    }

    return medicine;
  }

  buildMessage(name, action, qty, oldQty, newQty, isLowStock) {
    const actionVerb = action === 'add' ? 'Added' : action === 'subtract' ? 'Removed' : 'Set';
    const changeDesc = action === 'set'
      ? `Stock set to ${newQty}`
      : `${actionVerb} ${qty} units. Stock: ${oldQty} → ${newQty}`;

    const lowStockWarning = isLowStock
      ? ` ⚠️ Warning: Stock is now below minimum threshold (${newQty} units).`
      : '';

    return `✅ ${name}: ${changeDesc}.${lowStockWarning}`;
  }
}
