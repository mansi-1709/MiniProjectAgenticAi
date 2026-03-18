/**
 * Billing Service
 * Handles bill calculation and generation
 */

export class BillingService {
  /**
   * Calculate bill for an order
   * @param {Array} items - Array of {medicineName, quantity, price}
   * @returns {Object} Bill details
   */
  calculateBill(items) {
    const itemsWithSubtotals = items.map(item => ({
      ...item,
      subtotal: item.price * item.quantity,
    }));

    const totalAmount = itemsWithSubtotals.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    return {
      items: itemsWithSubtotals,
      totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Generate printable bill data
   * @param {Object} order - Order object with patient details
   * @param {Object} patient - Patient object
   * @returns {Object} Complete bill data
   */
  generateBillData(order, patient) {
    const currentDate = new Date();
    
    return {
      billNumber: `BILL-${order._id.toString().substring(0, 8).toUpperCase()}`,
      date: currentDate.toLocaleDateString('en-IN'),
      time: currentDate.toLocaleTimeString('en-IN'),
      
      patient: {
        name: patient.name,
        phone: patient.phone,
        age: patient.age,
      },
      
      items: order.items,
      totalAmount: order.totalAmount,
      
      pharmacy: {
        name: 'AI Pharmacy',
        address: '123 Medical Street, Healthcare City',
        phone: '+91 1234567890',
        email: 'info@aipharmacy.com',
      },
    };
  }
}

export default new BillingService();
