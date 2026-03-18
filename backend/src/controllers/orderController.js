import Order from '../models/Order.js';
import Patient from '../models/Patient.js';
import Medicine from '../models/Medicine.js';
import {
  OrderingAgent,
  SafetyAgent,
  InventoryRefillAgent,
  NotificationAgent,
  ObservabilityAgent,
  ConversationalPharmacistAgent,
} from '../agents/index.js';
import billingService from '../services/billingService.js';

// Initialize agents
const orderingAgent = new OrderingAgent();
const safetyAgent = new SafetyAgent();
const inventoryAgent = new InventoryRefillAgent();
const notificationAgent = new NotificationAgent();
const observabilityAgent = new ObservabilityAgent();
const conversationalAgent = new ConversationalPharmacistAgent();

/**
 * Order Controller
 * Orchestrates the complete order workflow with AI agents
 */

// Process chat-based order
export const processChatOrder = async (req, res) => {
  try {
    const { message, patientId } = req.body;

    if (!message || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Message and patientId are required',
      });
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found',
      });
    }

    console.log(`\n🤖 Processing order for patient: ${patient.name}`);
    console.log(`💬 Message: "${message}"\n`);

    // STEP 1: Ordering Agent - Extract structured data
    console.log('Step 1: Ordering Agent processing...');
    const orderingResult = await orderingAgent.extractOrder(message);
    
    await observabilityAgent.logAgentExecution({
      agentName: 'OrderingAgent',
      input: { message },
      output: orderingResult.data,
      reasoning: orderingResult.reasoning,
      executionTimeMs: orderingResult.executionTimeMs,
    });

    if (!orderingResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to understand order',
        error: orderingResult.error,
      });
    }

    const { medicineName, quantity } = orderingResult.data;
    console.log(`✅ Extracted: ${quantity} x ${medicineName}`);

    // STEP 2: Safety Agent - Validate order
    console.log('\nStep 2: Safety Agent validating...');
    const safetyResult = await safetyAgent.validateOrder({
      medicineName,
      quantity,
      patientId,
    });

    await observabilityAgent.logAgentExecution({
      agentName: 'SafetyAgent',
      input: { medicineName, quantity, patientId },
      output: safetyResult.data,
      reasoning: safetyResult.reasoning,
      executionTimeMs: safetyResult.executionTimeMs,
    });

    if (!safetyResult.success || safetyResult.data.status === 'REJECTED') {
      console.log(`❌ Order rejected: ${safetyResult.data.reason}`);
      
      // Create rejected order record
      const rejectedOrder = new Order({
        patientId,
        processedBy: req.user._id,
        items: [{
          medicineName,
          quantity,
          price: 0,
          subtotal: 0,
        }],
        totalAmount: 0,
        status: 'REJECTED',
        rejectionReason: safetyResult.data.reason,
      });
      await rejectedOrder.save();

      // Notify rejection
      await notificationAgent.sendNotification({
        type: 'ORDER_REJECTED',
        data: {
          medicineName,
          quantity,
          reason: safetyResult.data.reason,
        },
      });

      return res.status(400).json({
        success: false,
        message: safetyResult.data.reason,
        status: 'REJECTED',
      });
    }

    const medicine = safetyResult.data.medicine;
    console.log(`✅ Order validated`);

    // STEP 3: Calculate bill
    console.log('\nStep 3: Calculating bill...');
    const billData = billingService.calculateBill([
      {
        medicineName: medicine.name,
        quantity,
        price: medicine.price,
      },
    ]);

    // STEP 4: Create order
    const order = new Order({
      patientId,
      processedBy: req.user._id,
      items: billData.items,
      totalAmount: billData.totalAmount,
      status: 'APPROVED',
    });
    await order.save();
    console.log(`✅ Order created: ${order._id}`);

    // STEP 5: Update inventory
    console.log('\nStep 4: Updating inventory...');
    await Medicine.findByIdAndUpdate(medicine.id, {
      $inc: { stockQty: -quantity },
    });
    console.log(`✅ Stock updated: ${medicine.stockQty} → ${medicine.stockQty - quantity}`);

    // STEP 6: Inventory Refill Agent - Check stock levels
    console.log('\nStep 5: Inventory Agent checking stock...');
    const inventoryResult = await inventoryAgent.checkInventory(medicine.id);
    
    await observabilityAgent.logAgentExecution({
      orderId: order._id,
      agentName: 'InventoryRefillAgent',
      input: { medicineId: medicine.id },
      output: inventoryResult.data,
      reasoning: inventoryResult.reasoning,
      executionTimeMs: inventoryResult.executionTimeMs,
    });

    // STEP 7: Notification Agent - Send alerts if needed
    if (inventoryResult.success && inventoryResult.data.alertRequired) {
      console.log('\nStep 6: Sending low stock notification...');
      const notificationResult = await notificationAgent.sendNotification({
        type: 'LOW_STOCK',
        data: inventoryResult.data.alertData,
      });

      await observabilityAgent.logAgentExecution({
        orderId: order._id,
        agentName: 'NotificationAgent',
        input: { type: 'LOW_STOCK', data: inventoryResult.data.alertData },
        output: notificationResult.data,
        reasoning: notificationResult.reasoning,
        executionTimeMs: notificationResult.executionTimeMs,
      });
    }

    // Send success notification
    await notificationAgent.sendNotification({
      type: 'ORDER_APPROVED',
      data: {
        medicineName: medicine.name,
        quantity,
        totalAmount: billData.totalAmount,
      },
    });

    // Generate complete bill
    const completeBill = billingService.generateBillData(order, patient);

    console.log(`\n✅ Order completed successfully!\n`);

    // Return response
    res.status(201).json({
      success: true,
      message: `Order approved! ${quantity} ${medicine.name} dispensed. Total: ₹${billData.totalAmount}. Stock remaining: ${medicine.stockQty - quantity}`,
      status: 'APPROVED',
      order: {
        id: order._id,
        items: order.items,
        totalAmount: order.totalAmount,
      },
      bill: completeBill,
      lowStockAlert: inventoryResult.data?.alertRequired ? inventoryResult.data.alertData : null,
    });
  } catch (error) {
    console.error('Process Chat Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process order',
      error: error.message,
    });
  }
};

// Get all orders
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('patientId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error('Get Orders Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id).populate('patientId');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }
    
    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Get Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message,
    });
  }
};

/**
 * NEW: Conversational Pharmacist Ordering
 * Natural conversation like a real pharmacist
 */
export const processConversationalOrder = async (req, res) => {
  try {
    const { message, patientId } = req.body;

    if (!message || !patientId) {
      return res.status(400).json({
        success: false,
        message: 'Message and patientId are required',
      });
    }

    console.log(`\n🤖 Conversational Pharmacist Agent`);
    console.log(`👤 Patient ID: ${patientId}`);
    console.log(`💬 Message: "${message}"\n`);

    // Use Conversational Agent
    const conversationResult = await conversationalAgent.handleConversation({
      message,
      patientId,
    });

    // Log agent execution
    await observabilityAgent.logAgentExecution({
      agentName: 'ConversationalPharmacistAgent',
      input: { message, patientId },
      output: conversationResult.data,
      reasoning: conversationResult.reasoning,
      executionTimeMs: conversationResult.executionTimeMs,
    });

    if (!conversationResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Conversation failed',
        error: conversationResult.error,
      });
    }

    const result = conversationResult.data;

    // Handle different conversation outcomes
    switch (result.type) {
      case 'CLARIFICATION_NEEDED':
        return res.json({
          success: true,
          status: 'CLARIFICATION_NEEDED',
          message: result.message,
          questions: result.questions,
        });

      case 'PRESCRIPTION_REQUIRED':
        return res.json({
          success: true,
          status: 'PRESCRIPTION_REQUIRED',
          message: result.message,
          medicine: result.medicine,
          warnings: result.warnings,
          prescriptionMessage: result.prescriptionMessage,
        });

      case 'ORDER_READY':
        // Proceed with safety validation and order creation
        console.log('✅ AI analysis complete. Proceeding with order...');
        
        // Safety Agent validation
        const safetyResult = await safetyAgent.validateOrder({
          medicineName: result.medicine,
          quantity: result.quantity,
          patientId,
        });

        await observabilityAgent.logAgentExecution({
          agentName: 'SafetyAgent',
          input: { medicineName: result.medicine, quantity: result.quantity, patientId },
          output: safetyResult.data,
          reasoning: safetyResult.reasoning,
          executionTimeMs: safetyResult.executionTimeMs,
        });

        if (!safetyResult.success || safetyResult.data.status === 'REJECTED') {
          // Create rejected order
          const medicine = await Medicine.findOne({ 
            name: { $regex: new RegExp(`^${result.medicine}$`, 'i') }
          });

          const rejectedOrder = new Order({
            patientId,
            processedBy: req.user._id,
            items: [{
              medicineName: result.medicine,
              quantity: result.quantity,
              dosageDuration: result.dosageDuration,
              totalDaysSupply: result.totalDaysSupply,
              price: medicine?.price || 0,
              subtotal: (medicine?.price || 0) * result.quantity,
            }],
            totalAmount: (medicine?.price || 0) * result.quantity,
            status: 'REJECTED',
            rejectionReason: safetyResult.data.reason,
          });

          await rejectedOrder.save();

          return res.status(400).json({
            success: true,
            status: 'REJECTED',
            message: safetyResult.data.reason,
            pharmacistMessage: result.message,
          });
        }

        // Create approved order
        const medicine = await Medicine.findOne({ 
          name: { $regex: new RegExp(`^${result.medicine}$`, 'i') }
        });

        const orderData = {
          patientId,
          processedBy: req.user._id,
          items: [{
            medicineName: result.medicine,
            quantity: result.quantity,
            dosageDuration: result.dosageDuration || 'As prescribed',
            totalDaysSupply: result.totalDaysSupply || 0,
            price: medicine.price,
            subtotal: medicine.price * result.quantity,
          }],
          totalAmount: medicine.price * result.quantity,
          status: 'APPROVED',
        };

        const order = new Order(orderData);
        await order.save();

        // Update inventory
        medicine.stockQty -= result.quantity;
        await medicine.save();

        // Check if refill needed
        const inventoryResult = await inventoryAgent.checkInventory(medicine._id);
        await observabilityAgent.logAgentExecution({
          agentName: 'InventoryRefillAgent',
          input: { medicineId: medicine._id },
          output: inventoryResult.data,
          reasoning: inventoryResult.reasoning,
          executionTimeMs: inventoryResult.executionTimeMs,
        });

        // Send notification
        const patient = await Patient.findById(patientId);
        await notificationAgent.sendNotification({
          type: 'ORDER_SUCCESS',
          patientName: patient.name,
          orderDetails: order,
        });

        // Generate bill
        const completeBill = billingService.generateBillData(order, patient);

        console.log('✅ Order completed successfully via Conversational Agent\n');

        return res.status(201).json({
          success: true,
          status: 'APPROVED',
          message: result.message,
          order: {
            orderId: order._id,
            medicine: result.medicine,
            quantity: result.quantity,
            dosageDuration: result.dosageDuration,
            totalDaysSupply: result.totalDaysSupply,
            totalAmount: order.totalAmount,
          },
          bill: completeBill,
          warnings: result.warnings,
          conversationSummary: result.conversationSummary,
          ageConsideration: result.ageConsideration,
          lowStockAlert: inventoryResult.data?.alertRequired ? inventoryResult.data.alertData : null,
        });

      default:
        return res.status(400).json({
          success: false,
          message: 'Unknown conversation outcome',
        });
    }
  } catch (error) {
    console.error('Conversational Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process conversational order',
      error: error.message,
    });
  }
};
