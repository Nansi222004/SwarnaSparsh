/**
 * 📦 Blue Dart Shipping Provider
 *    Implements ShippingProvider for Blue Dart SOAP/REST APIs.
 *
 *    Env: BLUEDART_BASE_URL, BLUEDART_LOGIN_ID, BLUEDART_LICENCE_KEY,
 *         BLUEDART_CUSTOMER_CODE, BLUEDART_ORIGIN_AREA
 */

const axios = require("axios");
const ShippingProvider = require("./ShippingProvider");
const { mapStatus } = require("./shippingStatusMapper");

class BlueDartProvider extends ShippingProvider {
  constructor() {
    super("bluedart");
    this.baseURL = process.env.BLUEDART_BASE_URL || "https://api.bluedart.com";
    this.loginId = process.env.BLUEDART_LOGIN_ID || "";
    this.licenceKey = process.env.BLUEDART_LICENCE_KEY || "";
    this.customerCode = process.env.BLUEDART_CUSTOMER_CODE || "";
    this.originArea = process.env.BLUEDART_ORIGIN_AREA || "";

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
  }

  _getAuthProfile() {
    return {
      LoginID: this.loginId,
      LicenceKey: this.licenceKey,
      Api_type: "S",
    };
  }

  async checkServiceability({ pickupPincode, deliveryPincode, paymentMode = "prepaid" }) {
    try {
      const response = await this.client.post("/servlet/PincodeServiceServlet", {
        pinCode: deliveryPincode,
        profile: this._getAuthProfile(),
      });

      const data = response.data;
      const pincodeInfo = data?.PincodeServiceResult || data;

      if (pincodeInfo && (pincodeInfo.ODA === "N" || pincodeInfo.ApexInbound === "Y")) {
        return {
          serviceable: true,
          estimatedDays: pincodeInfo.TAT || null,
          codAvailable: paymentMode === "cod" ? (pincodeInfo.CODLimit > 0) : true,
          message: "Serviceable",
        };
      }

      return { serviceable: false, message: "Pincode not serviceable by Blue Dart" };
    } catch (err) {
      console.error("[BlueDart] Serviceability check failed:", err.message);
      return { serviceable: false, message: err.message };
    }
  }

  async createShipment(payload) {
    try {
      const {
        orderId, pickupAddress, deliveryAddress, package: pkg,
        paymentMode, codAmount, items, sellerName,
      } = payload;

      const waybillRequest = {
        Request: {
          Consignee: {
            ConsigneeName: deliveryAddress.name,
            ConsigneeAddress1: deliveryAddress.address,
            ConsigneePincode: deliveryAddress.pincode,
            ConsigneeMobile: deliveryAddress.phone,
            ConsigneeCity: deliveryAddress.city || "",
            ConsigneeState: deliveryAddress.state || "",
          },
          Shipper: {
            ShipperName: pickupAddress.name || sellerName || "Seller",
            ShipperAddress1: pickupAddress.address,
            ShipperPincode: pickupAddress.pincode,
            ShipperMobile: pickupAddress.phone,
            ShipperCity: pickupAddress.city || "",
            ShipperState: pickupAddress.state || "",
            CustomerCode: this.customerCode,
            OriginArea: this.originArea,
          },
          Services: {
            ActualWeight: (pkg.weight || 500) / 1000, // convert grams to kg
            CollectableAmount: paymentMode === "cod" ? (codAmount || 0) : 0,
            Commodity: {
              CommodityDetail1: items ? items.map(i => i.name).join(", ").substring(0, 100) : "Jewellery",
            },
            CreditReferenceNo: orderId,
            DeclaredValue: codAmount || 0,
            Dimensions: {
              Breadth: pkg.breadth || 10,
              Height: pkg.height || 10,
              Length: pkg.length || 10,
              Count: 1,
            },
            PieceCount: 1,
            ProductCode: paymentMode === "cod" ? "C" : "A",
            ProductType: paymentMode === "cod" ? "COD" : "Prepaid",
            SubProductCode: "",
          },
        },
        Profile: this._getAuthProfile(),
      };

      const response = await this.client.post("/servlet/WaybillGenerationServlet", waybillRequest);
      const result = response.data;
      const awb = result?.GenerateWaybillResult?.AWBNo || result?.AWBNo || `BD_${Date.now()}`;

      return {
        awbNumber: String(awb),
        waybill: String(awb),
        labelUrl: "",
        trackingUrl: `https://www.bluedart.com/tracking/${awb}`,
        courierResponse: result,
      };
    } catch (err) {
      console.error("[BlueDart] Create shipment failed:", err.message);
      throw new Error(`Blue Dart shipment creation failed: ${err.message}`);
    }
  }

  async schedulePickup({ awbNumber, pickupDate, pickupAddress }) {
    try {
      const response = await this.client.post("/servlet/PickupRegistrationServlet", {
        Request: {
          AWBNo: awbNumber,
          PickupDate: pickupDate || new Date().toISOString().split("T")[0],
          PickupTime: "1400",
          ShipperName: pickupAddress ? pickupAddress.name : "Seller",
          ShipperAddress: pickupAddress ? pickupAddress.address : "",
          ShipperPincode: pickupAddress ? pickupAddress.pincode : "",
          ShipperPhone: pickupAddress ? pickupAddress.phone : "",
        },
        Profile: this._getAuthProfile(),
      });

      return {
        pickupId: response.data?.PickupRegistrationResult?.TokenNo || "",
        scheduledDate: pickupDate || new Date().toISOString(),
        message: "Pickup scheduled successfully",
      };
    } catch (err) {
      console.error("[BlueDart] Schedule pickup failed:", err.message);
      return { pickupId: "", message: err.message };
    }
  }

  async cancelShipment({ awbNumber }) {
    try {
      const response = await this.client.post("/servlet/CancelWaybillServlet", {
        Request: { AWBNo: awbNumber },
        Profile: this._getAuthProfile(),
      });

      return {
        cancelled: true,
        message: "Shipment cancelled successfully",
        courierResponse: response.data,
      };
    } catch (err) {
      console.error("[BlueDart] Cancel shipment failed:", err.message);
      return { cancelled: false, message: err.message };
    }
  }

  async trackShipment({ awbNumber }) {
    try {
      const response = await this.client.post("/servlet/TrackingServlet", {
        Request: { AWBNo: awbNumber, Action: "T" },
        Profile: this._getAuthProfile(),
      });

      const data = response.data;
      const trackResult = data?.TrackingResult || data;
      const scans = trackResult?.ScanDetails || trackResult?.Scans || [];

      const timeline = (Array.isArray(scans) ? scans : []).map((scan) => ({
        status: mapStatus("bluedart", scan.Scan || scan.Status || "") || scan.Scan || "",
        location: scan.ScannedLocation || scan.Location || "",
        message: scan.Instructions || scan.Scan || scan.StatusDescription || "",
        date: scan.ScanDate || scan.StatusDate || new Date().toISOString(),
      }));

      const latestStatus = scans.length > 0
        ? mapStatus("bluedart", scans[scans.length - 1]?.Scan || scans[scans.length - 1]?.Status || "") || "IN_TRANSIT"
        : "CREATED";

      return {
        status: latestStatus,
        timeline,
        courierResponse: data,
      };
    } catch (err) {
      console.error("[BlueDart] Track shipment failed:", err.message);
      throw new Error(`Blue Dart tracking failed: ${err.message}`);
    }
  }

  async generateLabel({ awbNumber }) {
    try {
      const response = await this.client.post("/servlet/ShippingLabelServlet", {
        Request: { AWBNo: awbNumber },
        Profile: this._getAuthProfile(),
      });

      const labelUrl = response.data?.LabelUrl || response.data?.ShippingLabelResult?.LabelImage || "";
      return { labelUrl };
    } catch (err) {
      console.error("[BlueDart] Generate label failed:", err.message);
      return { labelUrl: "" };
    }
  }
}

module.exports = BlueDartProvider;
