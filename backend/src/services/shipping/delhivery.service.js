/**
 * 📦 Delhivery Shipping Provider
 *    Implements ShippingProvider for Delhivery courier APIs.
 *
 *    Env: DELHIVERY_BASE_URL, DELHIVERY_API_TOKEN, DELHIVERY_PICKUP_NAME
 */

const axios = require("axios");
const ShippingProvider = require("./ShippingProvider");
const { mapStatus } = require("./shippingStatusMapper");

class DelhiveryProvider extends ShippingProvider {
  constructor() {
    super("delhivery");
    this.baseURL = process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com";
    this.token = process.env.DELHIVERY_API_TOKEN || process.env.DELHIVERY_TOKEN || "";
    this.pickupName = process.env.DELHIVERY_PICKUP_NAME || "Default Warehouse";

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Token ${this.token}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  async checkServiceability({ pickupPincode, deliveryPincode, paymentMode = "prepaid", weight = 500 }) {
    try {
      const params = {
        filter_codes: deliveryPincode,
        d_pin: deliveryPincode,
        o_pin: pickupPincode,
        ...(paymentMode === "cod" ? { pt: "COD" } : { pt: "Pre-paid" }),
      };

      const response = await this.client.get("/c/api/pin-codes/json/", { params });
      const data = response.data;

      if (data && data.delivery_codes && data.delivery_codes.length > 0) {
        const info = data.delivery_codes[0]?.postal_code || {};
        return {
          serviceable: true,
          estimatedDays: info.pre_paid_d || info.cod_d || null,
          codAvailable: !!info.cod,
          message: "Serviceable",
        };
      }

      return { serviceable: false, message: "Pincode not serviceable by Delhivery" };
    } catch (err) {
      console.error("[Delhivery] Serviceability check failed:", err.message);
      return { serviceable: false, message: err.message };
    }
  }

  async createShipment(payload) {
    try {
      const {
        orderId, pickupAddress, deliveryAddress, package: pkg,
        paymentMode, codAmount, items, sellerName,
      } = payload;

      const shipmentData = {
        format: "json",
        data: {
          shipments: [{
            name: deliveryAddress.name,
            add: deliveryAddress.address,
            pin: deliveryAddress.pincode,
            city: deliveryAddress.city,
            state: deliveryAddress.state,
            country: deliveryAddress.country || "India",
            phone: deliveryAddress.phone,
            order: orderId,
            payment_mode: paymentMode === "cod" ? "COD" : "Prepaid",
            cod_amount: paymentMode === "cod" ? (codAmount || 0) : 0,
            return_pin: pickupAddress.pincode,
            return_city: pickupAddress.city,
            return_phone: pickupAddress.phone,
            return_add: pickupAddress.address,
            return_state: pickupAddress.state,
            return_country: "India",
            return_name: pickupAddress.name || sellerName || "Seller",
            weight: pkg.weight || 500,
            quantity: items ? items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 1,
            shipment_width: pkg.breadth || 10,
            shipment_height: pkg.height || 10,
            shipment_length: pkg.length || 10,
            products_desc: items ? items.map(i => i.name).join(", ") : "Jewellery",
            hsn_code: "",
            seller_name: sellerName || pickupAddress.name || "Seller",
            pickup_location: {
              name: this.pickupName,
              add: pickupAddress.address,
              city: pickupAddress.city,
              pin_code: pickupAddress.pincode,
              country: "India",
              phone: pickupAddress.phone,
            },
          }],
          pickup_location: {
            name: this.pickupName,
            add: pickupAddress.address,
            city: pickupAddress.city,
            pin_code: pickupAddress.pincode,
            country: "India",
            phone: pickupAddress.phone,
          },
        },
      };

      const response = await this.client.post("/api/cmu/create.json", shipmentData);
      const result = response.data;

      const packages = result?.packages || result?.upload_wbn?.packages || [];
      const firstPkg = packages[0] || {};

      return {
        awbNumber: firstPkg.waybill || result?.waybill || `DLV_${Date.now()}`,
        waybill: firstPkg.waybill || result?.waybill || "",
        labelUrl: "",
        trackingUrl: `https://www.delhivery.com/track/package/${firstPkg.waybill || ""}`,
        courierResponse: result,
      };
    } catch (err) {
      console.error("[Delhivery] Create shipment failed:", err.message);
      throw new Error(`Delhivery shipment creation failed: ${err.message}`);
    }
  }

  async schedulePickup({ awbNumber, pickupDate, pickupAddress }) {
    try {
      const response = await this.client.post("/fm/request/new/", {
        pickup_time: pickupDate || new Date().toISOString(),
        pickup_location: pickupAddress ? pickupAddress.address : this.pickupName,
        expected_package_count: 1,
      });

      return {
        pickupId: response.data?.pickup_id || "",
        scheduledDate: pickupDate || new Date().toISOString(),
        message: "Pickup scheduled successfully",
      };
    } catch (err) {
      console.error("[Delhivery] Schedule pickup failed:", err.message);
      return { pickupId: "", message: err.message };
    }
  }

  async cancelShipment({ awbNumber, waybill }) {
    try {
      const wbn = waybill || awbNumber;
      const response = await this.client.post("/api/p/edit", {
        waybill: wbn,
        cancellation: true,
      });

      return {
        cancelled: true,
        message: "Shipment cancelled successfully",
        courierResponse: response.data,
      };
    } catch (err) {
      console.error("[Delhivery] Cancel shipment failed:", err.message);
      return { cancelled: false, message: err.message };
    }
  }

  async trackShipment({ awbNumber, waybill }) {
    try {
      const wbn = waybill || awbNumber;
      const response = await this.client.get("/api/v1/packages/json/", {
        params: { waybill: wbn },
      });

      const data = response.data;
      const shipment = data?.ShipmentData?.[0]?.Shipment || {};
      const scans = shipment?.Scans || [];

      const timeline = scans.map((scan) => {
        const scanDetail = scan?.ScanDetail || {};
        return {
          status: mapStatus("delhivery", scanDetail.Scan || scanDetail.Instructions || "") || scanDetail.Scan || "",
          location: scanDetail.ScannedLocation || "",
          message: scanDetail.Instructions || scanDetail.Scan || "",
          date: scanDetail.ScanDateTime || scanDetail.StatusDateTime || new Date().toISOString(),
        };
      });

      const currentStatus = mapStatus("delhivery", shipment?.Status?.Status || "") || "IN_TRANSIT";

      return {
        status: currentStatus,
        timeline,
        courierResponse: data,
      };
    } catch (err) {
      console.error("[Delhivery] Track shipment failed:", err.message);
      throw new Error(`Delhivery tracking failed: ${err.message}`);
    }
  }

  async generateLabel({ awbNumber }) {
    try {
      const labelUrl = `${this.baseURL}/api/p/packing_slip?wbns=${awbNumber}&pdf=true`;
      return { labelUrl };
    } catch (err) {
      console.error("[Delhivery] Generate label failed:", err.message);
      return { labelUrl: "" };
    }
  }
}

module.exports = DelhiveryProvider;
