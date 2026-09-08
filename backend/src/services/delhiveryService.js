/**
 * 📦 Delhivery Shipping Service
 *    Handles DELHIVERY shipping integration.
 *
 * Delhivery Docs: https://www.delhivery.com/docs/
 * Token: DELHIVERY_TOKEN in .env
 */

const axios = require("axios");

const delhiveryClient = axios.create({
  baseURL: process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com",
  headers: {
    Authorization: `Token ${process.env.DELHIVERY_TOKEN}`,
    "Content-Type": "application/json",
  },
});

/**
 * Create forward shipment
 */
const createShipment = async (orderData) => {
  // Logic for production activation:
  // const response = await delhiveryClient.post("/api/cmu/create.json", orderData);
  // return response.data;
  console.log("[Delhivery] Shipment created (stub)");
  return { success: true, trackingId: "DLV_STUB_" + Date.now() };
};

/**
 * Schedule reverse pickup
 */
const createPickupRequest = async (returnData) => {
  console.log("[Delhivery] Pickup scheduled (stub)");
  return { success: true, pickupId: "PU_STUB_" + Date.now() };
};

/**
 * Track shipment
 */
const trackShipment = async (waybill) => {
  console.log("[Delhivery] Tracking info fetched (stub)");
  return { status: "In Transit", location: "Hub" };
};

module.exports = { createShipment, createPickupRequest, trackShipment };
