/**
 * 📦 Admin Shipping Controller
 *    Admin monitors, filters, overrides, and reports on all shipments.
 */

const mongoose = require("mongoose");
const Shipment = require("../../../models/Shipment");
const Order = require("../../../models/Order");
const PickupLocation = require("../../../models/PickupLocation");
const Setting = require("../../../models/Setting");
const { success, error, paginated } = require("../../../utils/apiResponse");
const { getCourierProvider, getAvailableCouriers } = require("../../../services/shipping/courierFactory");
const { isValidInternalStatus, getInternalStatuses } = require("../../../services/shipping/shippingStatusMapper");

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildPickupAddress = (source) => ({
  name: source.contactPerson || source.fullName || source.shopName || "Swarna Sparsh Dispatch",
  phone: source.phone || source.mobileNumber || "+919921128662",
  address: source.addressLine1
    ? [source.addressLine1, source.addressLine2].filter(Boolean).join(", ")
    : source.shopAddress || source.address || "Swarna Sparsh, Sarafa Lane Gandhi Chowk",
  city: source.city || "Wani",
  state: source.state || "Maharashtra",
  pincode: source.pincode || "445304",
  country: source.country || "India",
});

const buildDeliveryAddress = (shippingAddr = {}) => ({
  name: [shippingAddr.firstName, shippingAddr.lastName].filter(Boolean).join(" ") || "Customer",
  phone: shippingAddr.phone || "",
  address: [shippingAddr.flatNo, shippingAddr.area].filter(Boolean).join(", ") || "",
  city: shippingAddr.city || "",
  state: shippingAddr.state || "",
  pincode: shippingAddr.pincode || "",
  country: "India",
});

const updateOrderShippingStatus = async (orderId) => {
  const shipments = await Shipment.find({ orderId });
  const order = await Order.findById(orderId);
  if (!order) return;

  const activeShipments = shipments.filter((s) => s.status !== "CANCELLED");
  const allDelivered = activeShipments.length > 0 &&
    activeShipments.every((s) => s.status === "DELIVERED");
  const allCancelled = shipments.length > 0 &&
    shipments.every((s) => s.status === "CANCELLED");
  const anyShipped = activeShipments.some((s) =>
    ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(s.status)
  );

  if (allDelivered) {
    order.status = "Delivered";
  } else if (allCancelled) {
    order.status = "Cancelled";
  } else if (anyShipped) {
    if (!["Out for Delivery", "Delivered"].includes(order.status)) {
      order.status = "Shipped";
    }
  } else if (activeShipments.length > 0) {
    if (order.status === "Pending") {
      order.status = "Processing";
    }
  }

  // Update order's main shippingInfo
  if (activeShipments.length > 0) {
    const latest = activeShipments[activeShipments.length - 1];
    order.shippingInfo = {
      carrier: latest.courier,
      trackingId: latest.awbNumber,
      trackingUrl: latest.trackingUrl || "",
    };
  }

  await order.save();
};

// ── Controller Methods ────────────────────────────────────────────────────────

/**
 * GET /api/admin/shipping
 * List all shipments with filters.
 */
exports.getAllShipments = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const { status, courier, sellerId, search, dateFrom, dateTo } = req.query;

    const query = {};
    if (status) query.status = status;
    if (courier) query.courier = courier;
    if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
      query.sellerId = sellerId;
    }
    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { awbNumber: { $regex: escaped, $options: "i" } },
      ];
    }
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [shipments, total] = await Promise.all([
      Shipment.find(query)
        .populate("orderId", "orderId status customerName total")
        .populate("sellerId", "fullName shopName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Shipment.countDocuments(query),
    ]);

    return paginated(res, { shipments }, {
      page, limit, totalItems: total, totalPages: Math.ceil(total / limit),
    }, "All shipments retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/shipping/:shipmentId
 * Get single shipment detail.
 */
exports.getShipmentDetail = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return error(res, "Invalid shipment ID", 400);
    }

    const shipment = await Shipment.findById(shipmentId)
      .populate("orderId", "orderId status customerName customerEmail customerPhone shippingAddress total paymentMethod items timeline")
      .populate("sellerId", "fullName shopName email mobileNumber shopAddress city state pincode");

    if (!shipment) return error(res, "Shipment not found", 404);

    return success(res, { shipment }, "Shipment detail retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/admin/shipping/:shipmentId/track
 * Admin-triggered tracking sync from courier.
 */
exports.trackShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return error(res, "Invalid shipment ID", 400);
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return error(res, "Shipment not found", 404);

    const provider = getCourierProvider(shipment.courier);
    const trackResult = await provider.trackShipment({
      awbNumber: shipment.awbNumber,
      waybill: shipment.waybill,
    });

    // Deduplicate timeline entries
    const existingKeys = new Set(
      shipment.timeline.map((t) => `${t.status}_${new Date(t.date).getTime()}`)
    );
    const newEntries = (trackResult.timeline || []).filter((entry) => {
      const key = `${entry.status}_${new Date(entry.date).getTime()}`;
      return !existingKeys.has(key);
    });
    if (newEntries.length > 0) {
      shipment.timeline.push(...newEntries);
    }

    if (trackResult.status && trackResult.status !== shipment.status) {
      shipment.status = trackResult.status;
    }

    shipment.courierResponse = trackResult.courierResponse || shipment.courierResponse;
    await shipment.save();

    await updateOrderShippingStatus(shipment.orderId);

    return success(res, { shipment }, "Tracking synced by admin");
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/admin/shipping/:shipmentId/cancel
 * Admin-triggered cancellation.
 */
exports.cancelShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return error(res, "Invalid shipment ID", 400);
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return error(res, "Shipment not found", 404);

    if (shipment.status === "CANCELLED") {
      return error(res, "Shipment is already cancelled", 400);
    }

    if (["DELIVERED", "RTO_DELIVERED"].includes(shipment.status)) {
      return error(res, "Cannot cancel a delivered shipment", 400);
    }

    const provider = getCourierProvider(shipment.courier);
    const cancelResult = await provider.cancelShipment({
      awbNumber: shipment.awbNumber,
      waybill: shipment.waybill,
    });

    shipment.status = "CANCELLED";
    shipment.timeline.push({
      status: "CANCELLED",
      message: `Shipment cancelled by admin. ${cancelResult.message || ""}`.trim(),
      date: new Date(),
    });
    await shipment.save();

    await updateOrderShippingStatus(shipment.orderId);

    return success(res, { shipment }, "Shipment cancelled by admin");
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PATCH /api/admin/shipping/:shipmentId/override-status
 * Admin manually overrides shipment status.
 */
exports.overrideStatus = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { status, message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return error(res, "Invalid shipment ID", 400);
    }

    if (!status || !isValidInternalStatus(status)) {
      return error(res, `Invalid status. Valid statuses: ${getInternalStatuses().join(", ")}`, 400);
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return error(res, "Shipment not found", 404);

    const prevStatus = shipment.status;
    shipment.status = status;
    shipment.timeline.push({
      status,
      message: message || `Status overridden by admin from ${prevStatus} to ${status}`,
      date: new Date(),
    });
    await shipment.save();

    await updateOrderShippingStatus(shipment.orderId);

    return success(res, { shipment }, `Shipment status overridden to ${status}`);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/shipping/reports
 * Courier-wise aggregate reports.
 */
exports.getReports = async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const matchStage = {};
    if (dateFrom || dateTo) {
      matchStage.createdAt = {};
      if (dateFrom) matchStage.createdAt.$gte = new Date(dateFrom);
      if (dateTo) matchStage.createdAt.$lte = new Date(dateTo);
    }

    const [courierStats, statusStats, failedDeliveries, rtoList] = await Promise.all([
      // Courier-wise counts
      Shipment.aggregate([
        { $match: matchStage },
        { $group: { _id: "$courier", count: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ["$status", "DELIVERED"] }, 1, 0] } } } },
      ]),
      // Status-wise counts
      Shipment.aggregate([
        { $match: matchStage },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      // Failed deliveries
      Shipment.find({ status: "FAILED", ...matchStage })
        .populate("orderId", "orderId")
        .populate("sellerId", "shopName")
        .select("awbNumber courier orderId sellerId createdAt")
        .sort({ createdAt: -1 })
        .limit(50),
      // RTO list
      Shipment.find({ status: { $in: ["RTO_INITIATED", "RTO_DELIVERED"] }, ...matchStage })
        .populate("orderId", "orderId")
        .populate("sellerId", "shopName")
        .select("awbNumber courier status orderId sellerId createdAt")
        .sort({ createdAt: -1 })
        .limit(50),
    ]);

    return success(res, {
      courierStats,
      statusStats,
      failedDeliveries,
      rtoList,
    }, "Shipping reports generated");
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/admin/shipping/:shipmentId/manifest
 * Generate Shiprocket manifest for a shipment.
 */
exports.generateManifest = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return error(res, "Invalid shipment ID", 400);
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return error(res, "Shipment not found", 404);
    if (shipment.courier !== "shiprocket") {
      return error(res, "Manifest generation is only supported for Shiprocket shipments", 400);
    }

    const provider = getCourierProvider("shiprocket");
    const result = await provider.generateManifest({
      awbNumbers: [shipment.awbNumber],
      shiprocketShipmentIds: shipment.shiprocketShipmentId ? [shipment.shiprocketShipmentId] : [],
    });

    if (result.manifestUrl) {
      shipment.manifestUrl = result.manifestUrl;
      await shipment.save();
    }

    return success(res, { manifestUrl: result.manifestUrl, shipment }, "Manifest generated");
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/admin/shipping/:shipmentId/generate-label
 * Re-generate label for a shipment (Shiprocket).
 */
exports.regenerateLabel = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return error(res, "Invalid shipment ID", 400);
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return error(res, "Shipment not found", 404);

    const provider = getCourierProvider(shipment.courier);
    const result = await provider.generateLabel({
      awbNumber: shipment.awbNumber,
      shiprocketShipmentId: shipment.shiprocketShipmentId,
    });

    if (result.labelUrl) {
      shipment.labelUrl = result.labelUrl;
      await shipment.save();
    }

    return success(res, { labelUrl: result.labelUrl, shipment }, "Label regenerated");
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/shipping/orders/:orderId
 * Get all shipments created for a specific order.
 */
exports.getOrderShipments = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return error(res, "Invalid order ID", 400);
    }

    const shipments = await Shipment.find({ orderId })
      .populate("orderId", "orderId status")
      .sort({ createdAt: -1 });

    return success(res, { shipments }, "Order shipments retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/admin/shipping/serviceability
 * Check if a courier can service the delivery route.
 */
exports.checkServiceability = async (req, res) => {
  try {
    const { courier, pickupPincode, deliveryPincode, paymentMode, weight, pickupLocationId } = req.body;

    if (!courier) return error(res, "Courier is required", 400);
    if (!deliveryPincode) return error(res, "Delivery pincode is required", 400);

    let resolvedPickupPincode = pickupPincode || "";

    if (!resolvedPickupPincode && pickupLocationId) {
      if (mongoose.Types.ObjectId.isValid(pickupLocationId)) {
        const pickupLoc = await PickupLocation.findOne({ _id: pickupLocationId, isActive: true });
        if (pickupLoc) resolvedPickupPincode = pickupLoc.pincode || "";
      }
    }

    if (!resolvedPickupPincode) {
      const defaultLoc = await PickupLocation.findOne({
        $or: [{ isStoreDefault: true }, { isDefault: true, sellerId: null }, { isDefault: true }],
        isActive: true,
      });
      resolvedPickupPincode = defaultLoc?.pincode || "";
    }

    if (!resolvedPickupPincode) {
      const settings = await Setting.findOne();
      resolvedPickupPincode = settings?.pincode || "445304";
    }

    const provider = getCourierProvider(courier);
    const result = await provider.checkServiceability({
      pickupPincode: resolvedPickupPincode,
      deliveryPincode,
      paymentMode,
      weight,
    });

    return success(
      res,
      { ...result, pickupPincode: resolvedPickupPincode, deliveryPincode },
      "Serviceability checked"
    );
  } catch (err) {
    return error(res, err.message, 400);
  }
};

/**
 * POST /api/admin/shipping/orders/:orderId/create
 * Create shipment for an order (Store fulfillment).
 */
exports.createShipment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { courier, packageInfo, paymentMode, codAmount, pickupLocationId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return error(res, "Invalid order ID", 400);
    }

    if (!courier || !getAvailableCouriers().includes(courier)) {
      return error(res, `Invalid courier. Supported: ${getAvailableCouriers().join(", ")}`, 400);
    }

    const order = await Order.findById(orderId).populate("items.productId", "name images");
    if (!order) return error(res, "Order not found", 404);

    const existingShipment = await Shipment.findOne({ orderId, status: { $ne: "CANCELLED" } });
    if (existingShipment) {
      return error(res, "An active shipment already exists for this order", 409);
    }

    const shippingAddr = order.shippingAddress || {};
    if (!shippingAddr.pincode) return error(res, "Customer delivery pincode is missing", 400);
    if (!shippingAddr.phone) return error(res, "Customer phone is missing", 400);
    const customerName = [shippingAddr.firstName, shippingAddr.lastName].filter(Boolean).join(" ");
    if (!customerName) return error(res, "Customer name is missing", 400);
    const customerAddress = [shippingAddr.flatNo, shippingAddr.area].filter(Boolean).join(", ");
    if (!customerAddress) return error(res, "Customer address is missing", 400);

    const pkg = packageInfo || {};
    if (!pkg.weight || pkg.weight <= 0) return error(res, "Package weight is required", 400);
    if (!pkg.length || !pkg.breadth || !pkg.height) {
      return error(res, "Package dimensions (length, breadth, height) are required", 400);
    }

    const mode = paymentMode || (order.paymentMethod === "cod" ? "cod" : "prepaid");
    if (mode === "cod" && (!codAmount || codAmount <= 0)) {
      return error(res, "COD amount is required for COD orders", 400);
    }

    // Resolve store dispatch warehouse
    let pickupAddress;
    let shiprocketPickupName = null;

    if (pickupLocationId && mongoose.Types.ObjectId.isValid(pickupLocationId)) {
      const pickupLoc = await PickupLocation.findOne({ _id: pickupLocationId, isActive: true });
      if (pickupLoc) {
        pickupAddress = buildPickupAddress(pickupLoc);
        shiprocketPickupName = pickupLoc.shiprocket?.pickupName || pickupLoc.warehouseName;
      }
    }

    if (!pickupAddress) {
      const defaultLoc = await PickupLocation.findOne({
        $or: [{ isStoreDefault: true }, { isDefault: true, sellerId: null }, { isDefault: true }],
        isActive: true,
      });
      if (defaultLoc) {
        pickupAddress = buildPickupAddress(defaultLoc);
        shiprocketPickupName = defaultLoc.shiprocket?.pickupName || defaultLoc.warehouseName;
      }
    }

    if (!pickupAddress) {
      const settings = await Setting.findOne();
      pickupAddress = buildPickupAddress(settings || {});
      shiprocketPickupName = "Primary Warehouse";
    }

    const deliveryAddress = buildDeliveryAddress(shippingAddr);

    // Verify serviceability
    const provider = getCourierProvider(courier);
    const serviceResult = await provider.checkServiceability({
      pickupPincode: pickupAddress.pincode,
      deliveryPincode: deliveryAddress.pincode,
      paymentMode: mode,
      weight: pkg.weight,
    });

    if (!serviceResult.serviceable) {
      return error(res, `Courier not serviceable: ${serviceResult.message}`, 400);
    }

    if (mode === "cod" && serviceResult.codAvailable === false) {
      return error(res, "COD not available for this route with selected courier", 400);
    }

    const shipmentItems = (order.items || []).map((item) => ({
      productId: item.productId?._id || item.productId,
      variantId: item.variantId,
      name: item.name || item.productId?.name || "Jewelry Item",
      sku: item.sku || "",
      quantity: item.quantity || 1,
      price: item.price || 0,
    }));

    const courierResult = await provider.createShipment({
      orderId: order.orderId || order._id.toString(),
      pickupAddress,
      deliveryAddress,
      package: pkg,
      paymentMode: mode,
      codAmount: mode === "cod" ? codAmount : 0,
      items: shipmentItems,
      sellerName: "Swarna Sparsh",
      shiprocketPickupName,
    });

    let labelUrl = courierResult.labelUrl || "";
    if (!labelUrl && courierResult.awbNumber && courier !== "shiprocket") {
      try {
        const labelResult = await provider.generateLabel({ awbNumber: courierResult.awbNumber });
        labelUrl = labelResult.labelUrl || "";
      } catch (labelErr) {
        console.warn("[Admin Shipping] Label generation failed:", labelErr.message);
      }
    }

    const shipment = await Shipment.create({
      orderId: order._id,
      sellerId: null,
      courier,
      awbNumber: courierResult.awbNumber,
      waybill: courierResult.waybill || courierResult.awbNumber,
      labelUrl,
      invoiceUrl: courierResult.invoiceUrl || "",
      manifestUrl: "",
      trackingUrl: courierResult.trackingUrl || "",
      shiprocketOrderId: courierResult.shiprocketOrderId || null,
      shiprocketShipmentId: courierResult.shiprocketShipmentId || null,
      shiprocketPickupName: shiprocketPickupName || null,
      status: "CREATED",
      pickupAddress,
      deliveryAddress,
      package: pkg,
      paymentMode: mode,
      codAmount: mode === "cod" ? codAmount : 0,
      items: shipmentItems,
      courierResponse: courierResult.courierResponse,
      timeline: [{
        status: "CREATED",
        message: `Shipment created via ${courier}. AWB: ${courierResult.awbNumber}`,
        date: new Date(),
      }],
    });

    await updateOrderShippingStatus(order._id);

    order.timeline.push({
      status: order.status,
      note: `Shipment booked with ${courier}. AWB: ${courierResult.awbNumber}`,
      date: new Date(),
    });
    await order.save();

    return success(res, { shipment }, "Shipment created successfully", 201);
  } catch (err) {
    console.error("[Admin Shipping] Create shipment failed:", err.message);
    return error(res, err.message, 500);
  }
};

/**
 * POST /api/admin/shipping/:shipmentId/pickup
 * Request courier pickup (Shiprocket).
 */
exports.requestPickup = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shipmentId)) {
      return error(res, "Invalid shipment ID", 400);
    }

    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) return error(res, "Shipment not found", 404);

    if (shipment.status === "CANCELLED") {
      return error(res, "Cannot request pickup for a cancelled shipment", 400);
    }

    shipment.status = "PICKUP_SCHEDULED";
    shipment.timeline.push({
      status: "PICKUP_SCHEDULED",
      message: "Pickup scheduled by admin",
      date: new Date(),
    });
    await shipment.save();

    await updateOrderShippingStatus(shipment.orderId);

    return success(res, { shipment }, "Pickup requested successfully");
  } catch (err) {
    return error(res, err.message);
  }
};
