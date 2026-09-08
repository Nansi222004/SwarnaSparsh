const Order = require("../../../models/Order");
const { success, error } = require("../../../utils/apiResponse");
const mongoose = require("mongoose");
const { emitOrderStatusUpdate } = require("../../../services/socketEmitter");
const {
  confirmCommissionsForOrder,
  reverseCommissionsForOrder
} = require("../../../services/commissionService");
const { processRefund: razorpayProcessRefund } = require("../../../services/razorpayService");
const auditLogger = require("../../../utils/auditLogger");
const { createNotification } = require("../../../services/notificationService");

const ALLOWED_TRANSITIONS = {
  Pending: [],
  Processing: ["Confirmed", "Cancelled"],
  Confirmed: ["Packed", "Cancelled"],
  Packed: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery", "Delivered"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
  "Return Requested": ["Returned"],
  Returned: []
};

exports.getOrderSummary = async (req, res) => {
  try {
    const [summary] = await Order.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          delivered: {
            $sum: {
              $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0]
            }
          },
          returned: {
            $sum: {
              $cond: [{ $eq: ["$status", "Returned"] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["Pending", "Processing", "Confirmed", "Packed", "Shipped", "Out for Delivery", "Return Requested"]
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const data = summary || { total: 0, pending: 0, delivered: 0, cancelled: 0, returned: 0 };
    return success(res, { summary: data }, "Order summary retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, userId } = req.query;
    const parsedPage = Math.max(1, Number(page) || 1);
    const parsedLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const query = {};

    if (status) {
      if (status.toLowerCase() === 'pending') {
        query.status = { $in: [/^pending$/i, /^processing$/i, /^confirmed$/i, /^packed$/i, /^out for delivery$/i, /^return requested$/i] };
      } else {
        query.status = { $regex: new RegExp(`^${status}$`, "i") };
      }
    }
    if (userId) query.userId = userId;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } }
      ];
    }

    const orders = await Order.find(query)
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .limit(parsedLimit)
      .skip((parsedPage - 1) * parsedLimit)
      .lean();

    const total = await Order.countDocuments(query);

    return success(res, { 
      orders, 
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.max(1, Math.ceil(total / parsedLimit))
      } 
    }, "Orders retrieved");
  } catch (err) { return error(res, err.message); }
};

exports.getOrderDetail = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return error(res, "Invalid order id", 400);
    }
    const order = await Order.findById(req.params.id)
      .populate("userId", "name email phone")
      .lean();
    if (!order) return error(res, "Order not found", 404);

    const hasValidProducts = order.items && order.items.some(
      item => item.productId && mongoose.Types.ObjectId.isValid(item.productId)
    );
    if (hasValidProducts) {
      await Order.populate(order, {
        path: "items.productId",
        select: "name images variants",
        model: "Product"
      });
    }

    return success(res, { order }, "Order details retrieved");
  } catch (err) { return error(res, err.message); }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, shippingInfo, itemVoidTags } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, "Invalid order id", 400);
    }

    const order = await Order.findById(id);
    if (!order) return error(res, "Order not found", 404);

    const nextStatus = String(status || "").trim();
    const currentStatus = String(order.status || "").trim();
    const normalizedShippingInfo = shippingInfo && typeof shippingInfo === "object"
      ? {
          carrier: String(shippingInfo.carrier || "").trim(),
          trackingId: String(shippingInfo.trackingId || "").trim(),
          trackingUrl: String(shippingInfo.trackingUrl || "").trim(),
          estimatedDelivery: shippingInfo.estimatedDelivery || undefined
        }
      : null;

    if (!nextStatus) {
      return error(res, "Status is required", 400);
    }

    const isSameStatusUpdate = nextStatus === currentStatus;
    if (!isSameStatusUpdate) {
      const allowedStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
      if (!allowedStatuses.includes(nextStatus)) {
        return error(res, `Invalid status transition from ${currentStatus} to ${nextStatus}`, 400);
      }
    }
    
    if (Array.isArray(itemVoidTags)) {
      itemVoidTags.forEach(({ itemId, voidTagId }) => {
        const item = order.items.id(itemId);
        if (item) {
          item.voidTagId = String(voidTagId || "").trim();
        }
      });
    }

    if (["Shipped", "Out for Delivery"].includes(nextStatus)) {
      const mergedShippingInfo = {
        ...(order.shippingInfo || {}),
        ...(normalizedShippingInfo || {})
      };
      if (!String(mergedShippingInfo.carrier || "").trim()) {
        return error(res, "Carrier is required before marking this order for shipment", 400);
      }
      order.shippingInfo = mergedShippingInfo;
    } else if (normalizedShippingInfo) {
      order.shippingInfo = {
        ...(order.shippingInfo || {}),
        ...normalizedShippingInfo
      };
    }

    if (!isSameStatusUpdate) {
      order.status = nextStatus;
    }
    
    order.timeline.push({
      status: isSameStatusUpdate ? currentStatus : nextStatus,
      note: note || (isSameStatusUpdate ? "Order shipping info updated" : `Order status updated to ${nextStatus}`),
      date: new Date()
    });

    await order.save();

    if (!isSameStatusUpdate && ["Cancelled", "Returned"].includes(nextStatus)) {
      if (Array.isArray(order.appliedGiftCards) && order.appliedGiftCards.length > 0) {
        const GiftCard = require("../../../models/GiftCard");
        for (const gc of order.appliedGiftCards) {
          if (!gc.cardId || !gc.amountUsed) continue;
          const updatedCard = await GiftCard.findOneAndUpdate(
            { _id: gc.cardId },
            {
              $inc:  { balance: gc.amountUsed },
              $pull: { redemptions: { orderId: order.orderId } },
            },
            { new: true }
          );
          if (updatedCard) {
            const newStatus = updatedCard.balance <= 0 ? "used" : updatedCard.balance < updatedCard.value ? "partially_used" : "active";
            await GiftCard.updateOne({ _id: gc.cardId }, { status: newStatus });
            console.log(`[GiftCard] Admin Refunded ₹${gc.amountUsed} back to card ${gc.code} (new balance: ₹${updatedCard.balance}) for order ${order.orderId}`);
          }
        }
      }
    }

    const refreshed = await Order.findById(order._id)
      .populate("userId", "name email phone")
      .lean();

    const hasValidProducts = refreshed.items && refreshed.items.some(
      item => item.productId && mongoose.Types.ObjectId.isValid(item.productId)
    );
    if (hasValidProducts) {
      await Order.populate(refreshed, {
        path: "items.productId",
        select: "name images variants",
        model: "Product"
      });
    }

    // ── Realtime: notify the customer of their order status change (best-effort) ──
    if (!isSameStatusUpdate) {
      try { emitOrderStatusUpdate(order); } catch (e) { /* non-blocking */ }

      if (nextStatus === "Cancelled" && order.userId) {
        try {
          await createNotification({
            userId: order.userId,
            title: "Order Cancelled",
            message: `Your order #${order.orderId} has been cancelled by the administrator.`,
            type: "CANCEL",
            link: "/profile/orders"
          });
        } catch (err) {
          console.error("[Notification] Failed to create order cancellation notification:", err.message);
        }
      }
    }

    // ── Platform commission lifecycle ─────────────────────────────────────────
    if (!isSameStatusUpdate) {
      try {
        if (nextStatus === "Delivered") {
          await confirmCommissionsForOrder(order._id, { safe: true });
        } else if (nextStatus === "Cancelled") {
          await reverseCommissionsForOrder(order._id, {
            triggeredBy: "order_cancelled",
            reasonNote:  "Cancelled by admin",
            safe:        true,
          });
        } else if (nextStatus === "Returned") {
          await reverseCommissionsForOrder(order._id, {
            triggeredBy: "return_refunded",
            reasonNote:  "Marked Returned by admin",
            safe:        true,
          });
        }
      } catch (e) {
        console.error("[Commission] Admin status-transition hook error:", e.message);
      }

      // Audit log — non-blocking
      auditLogger.log(req, {
        action:      "STATUS_CHANGE",
        entity:      "Order",
        entityId:    String(order._id),
        entityLabel: order.orderId || String(order._id),
        before:      { status: currentStatus },
        after:       { status: nextStatus }
      });
    }

    return success(
      res,
      { order: refreshed },
      isSameStatusUpdate ? "Order shipping info updated" : `Order status updated to ${nextStatus}`
    );
  } catch (err) { return error(res, err.message); }
};

exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return error(res, "Invalid order id", 400);
    }

    const order = await Order.findById(id);
    if (!order) return error(res, "Order not found", 404);

    // Guard: only Razorpay orders can be refunded online
    if (order.paymentMethod !== "razorpay") {
      return error(res, "Refunds are only available for online Razorpay payments.", 400);
    }

    // Guard: must have a captured payment ID
    if (!order.razorpayPaymentId) {
      return error(res, "No Razorpay payment ID found for this order. The payment may not have been captured.", 400);
    }

    // Guard: prevent double-refund
    if (order.refundStatus === "processed") {
      return error(res, `This order has already been refunded (Refund ID: ${order.refundId}).`, 400);
    }

    // Guard: pending in-flight refund
    if (order.refundStatus === "pending") {
      return error(res, "A refund is already in progress for this order.", 400);
    }

    // Determine refund amount — body.amount is optional (defaults to full order total)
    const { amount: reqAmount, reason } = req.body || {};
    const refundAmount = reqAmount ? Number(reqAmount) : order.total;

    if (!refundAmount || refundAmount <= 0) {
      return error(res, "Refund amount must be greater than zero.", 400);
    }

    if (refundAmount > order.total) {
      return error(res, `Refund amount (${refundAmount}) cannot exceed the order total (${order.total}).`, 400);
    }

    const refundBefore = {
      refundStatus: order.refundStatus || null,
      paymentStatus: order.paymentStatus || null,
      refundAmount: order.refundAmount || null,
      refundId: order.refundId || null
    };

    // Mark as pending before calling Razorpay (optimistic lock)
    order.refundStatus = "pending";
    await order.save();

    let refundResult;
    try {
      refundResult = await razorpayProcessRefund(
        order.razorpayPaymentId,
        refundAmount,
        {
          orderId:  String(order.orderId  || order._id),
          reason:   reason || "Admin initiated refund",
          adminId:  String(req.user?._id || "admin")
        }
      );
    } catch (refundErr) {
      // Roll back the pending flag so admin can retry
      order.refundStatus = "failed";
      await order.save();
      return error(res, refundErr.message, 502);
    }

    // Persist refund metadata
    order.refundId     = refundResult.id;
    order.refundStatus = "processed";
    order.refundAmount = refundAmount;
    order.refundedAt   = new Date();
    order.paymentStatus = "refunded";
    order.timeline.push({
      status: order.status,
      note:   `Refund of INR ${refundAmount} processed. Razorpay Refund ID: ${refundResult.id}`,
      date:   new Date()
    });

    await order.save();

    if (order.userId) {
      try {
        await createNotification({
          userId: order.userId,
          title: "Refund Processed",
          message: `A refund of ₹${refundAmount} has been processed for your order #${order.orderId || order._id}.`,
          type: "RETURN",
          link: "/profile/orders"
        });
      } catch (err) {
        console.error("[Notification] Failed to create refund notification:", err.message);
      }
    }

    // Audit log — non-blocking
    auditLogger.log(req, {
      action:      "REFUND",
      entity:      "Order",
      entityId:    String(order._id),
      entityLabel: order.orderId || String(order._id),
      before:      refundBefore,
      after:       { refundStatus: "processed", refundAmount, refundId: refundResult.id }
    });

    const refreshed = await Order.findById(order._id)
      .populate("userId", "name email phone")
      .lean();

    const hasValidProducts = refreshed.items && refreshed.items.some(
      item => item.productId && mongoose.Types.ObjectId.isValid(item.productId)
    );
    if (hasValidProducts) {
      await Order.populate(refreshed, {
        path: "items.productId",
        select: "name images variants",
        model: "Product"
      });
    }

    return success(
      res,
      { order: refreshed, refundId: refundResult.id, refundAmount },
      `Refund of INR ${refundAmount} processed successfully.`
    );
  } catch (err) {
    console.error("[Refund] Unexpected error:", err.message);
    return error(res, err.message);
  }
};
