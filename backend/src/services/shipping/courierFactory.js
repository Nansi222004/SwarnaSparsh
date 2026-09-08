/**
 * 📦 Courier Factory
 *    Returns the correct ShippingProvider instance based on courier name.
 *    Designed for easy extension – add new providers here.
 *
 *    Current providers: delhivery | bluedart | shiprocket
 *    Future providers: add here without changing any controller.
 */

const DelhiveryProvider = require("./delhivery.service");
const BlueDartProvider = require("./bluedart.service");
const ShiprocketProvider = require("./shiprocket.service");

const providers = {
  delhivery: null,
  bluedart: null,
  shiprocket: null,
  // Future: xpressbees: null, ecomexpress: null, dtdc: null
};

/**
 * Lazy-initialize and return the shipping provider instance.
 * @param {string} courier - "delhivery" | "bluedart" | "shiprocket"
 * @returns {import("./ShippingProvider")}
 */
const getCourierProvider = (courier) => {
  const key = String(courier || "").toLowerCase().trim();

  if (!providers.hasOwnProperty(key)) {
    throw new Error(`Unsupported courier provider: "${courier}". Supported: ${Object.keys(providers).join(", ")}`);
  }

  // Lazy singleton
  if (!providers[key]) {
    switch (key) {
      case "delhivery":
        providers[key] = new DelhiveryProvider();
        break;
      case "bluedart":
        providers[key] = new BlueDartProvider();
        break;
      case "shiprocket":
        providers[key] = new ShiprocketProvider();
        break;
      default:
        throw new Error(`No provider implementation for: "${key}"`);
    }
  }

  return providers[key];
};

/**
 * Returns list of available courier names.
 */
const getAvailableCouriers = () => Object.keys(providers);

module.exports = { getCourierProvider, getAvailableCouriers };
