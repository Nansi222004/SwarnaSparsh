/**
 * 📦 Shipping Provider – Base Interface
 *    All courier providers must extend this class.
 */

class ShippingProvider {
  /**
   * @param {string} name - Provider identifier (e.g. "delhivery", "bluedart")
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Check if a pincode pair is serviceable.
   * @param {{ pickupPincode: string, deliveryPincode: string, paymentMode: string, weight: number }} payload
   * @returns {Promise<{ serviceable: boolean, estimatedDays?: number, codAvailable?: boolean, message?: string }>}
   */
  async checkServiceability(payload) {
    throw new Error(`checkServiceability() not implemented for ${this.name}`);
  }

  /**
   * Create a new shipment / waybill with the courier.
   * @param {Object} payload - Shipment creation data
   * @returns {Promise<{ awbNumber: string, waybill?: string, labelUrl?: string, trackingUrl?: string, courierResponse: any }>}
   */
  async createShipment(payload) {
    throw new Error(`createShipment() not implemented for ${this.name}`);
  }

  /**
   * Schedule a pickup for an existing shipment.
   * @param {Object} payload
   * @returns {Promise<{ pickupId?: string, scheduledDate?: string, message?: string }>}
   */
  async schedulePickup(payload) {
    throw new Error(`schedulePickup() not implemented for ${this.name}`);
  }

  /**
   * Cancel an existing shipment.
   * @param {{ awbNumber: string, waybill?: string }} payload
   * @returns {Promise<{ cancelled: boolean, message?: string }>}
   */
  async cancelShipment(payload) {
    throw new Error(`cancelShipment() not implemented for ${this.name}`);
  }

  /**
   * Fetch live tracking information.
   * @param {{ awbNumber: string, waybill?: string }} payload
   * @returns {Promise<{ status: string, timeline: Array<{ status: string, location: string, message: string, date: string }>, courierResponse?: any }>}
   */
  async trackShipment(payload) {
    throw new Error(`trackShipment() not implemented for ${this.name}`);
  }

  /**
   * Generate / fetch shipping label.
   * @param {{ awbNumber: string }} payload
   * @returns {Promise<{ labelUrl: string }>}
   */
  async generateLabel(payload) {
    throw new Error(`generateLabel() not implemented for ${this.name}`);
  }
}

module.exports = ShippingProvider;
