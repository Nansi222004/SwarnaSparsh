const crypto = require("crypto");
const razorpay = require("../../../config/razorpay");
const Order = require("../../../models/Order");
const Coupon = require("../../../models/Coupon");
const Notification = require("../../../models/Notification");
const {
  _deductStockForOrder,
  _calculateOrderData,
  enrichUserProfileFromOrder,
} = require("./order.controller");
const { success, error } = require("../../../utils/apiResponse");
const mongoose = require("mongoose");
const { enqueueEmail } = require("../../../services/emailService");
const emailTemplates = require("../../../services/emailTemplates");
const Seller = require("../../../models/Seller");
const GiftCard = require("../../../models/GiftCard");
const { emitNewOrder } = require("../../../services/socketEmitter");
const {
  accrueCommissionsForOrder,
} = require("../../../services/commissionService");

const isPaymentSandboxAllowed = () => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.ALLOW_PAYMENT_SANDBOX === "true" ||
    !process.env.RAZORPAY_KEY_ID ||
    String(process.env.RAZORPAY_KEY_ID || "").startsWith("rzp_test_")
  );
};

const createSandboxOrder = (orderId, total) => ({
  id: `order_dev_${Date.now()}`,
  amount: Math.round(Number(total || 0) * 100),
  currency: "INR",
  status: "created",
  receipt: String(orderId || `ORD-${Date.now()}`),
  isDevMock: true,
});

// POST /api/user/payment/razorpay-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return error(res, "Invalid order id", 400);
    }

    // BUG-03 FIX: Ensure the order belongs to the requesting user
    const order = await Order.findOne({
      _id: orderId,
      userId: req.user.userId,
    });
    if (!order) return error(res, "Order not found", 404);

    if (order.paymentStatus === "paid") {
      return error(res, "This order is already paid", 400);
    }

    if (!razorpay) {
      if (isPaymentSandboxAllowed()) {
        console.warn(
          "[Razorpay] Payment service not configured. Returning test sandbox order.",
        );
        const rpOrder = createSandboxOrder(order.orderId, order.total);
        return success(res, { rpOrder }, "Razorpay order created (sandbox mode)");
      }
      return error(
        res,
        "Payment service is not configured on the server.",
        503,
      );
    }

    let rpOrder;
    try {
      const options = {
        amount: Math.round(order.total * 100),
        currency: "INR",
        receipt: order.orderId,
      };
      rpOrder = await razorpay.orders.create(options);
    } catch (rpErr) {
      console.error("[Razorpay createRazorpayOrder error]:", rpErr);
      const isAuthError =
        rpErr?.statusCode === 401 ||
        rpErr?.error?.description === "Authentication failed" ||
        rpErr?.error?.code === "BAD_REQUEST_ERROR";

      if (isPaymentSandboxAllowed() && isAuthError) {
        console.warn(
          "[Razorpay] API credentials invalid/expired. Falling back to test sandbox order.",
        );
        rpOrder = createSandboxOrder(order.orderId, order.total);
      } else {
        const errMsg =
          rpErr?.error?.description ||
          rpErr?.message ||
          "Failed to create payment gateway order.";
        return error(
          res,
          `Payment gateway error: ${errMsg}`,
          rpErr?.statusCode || 400,
        );
      }
    }

    return success(res, { rpOrder }, "Razorpay order created");
  } catch (err) {
    console.error("[createRazorpayOrder error]:", err);
    const errMsg =
      err?.error?.description || err?.message || "Razorpay order creation failed";
    return error(res, errMsg, err?.statusCode || 500);
  }
};

// Helper function to create and process prepaid orders (shared by zero-total bypass and Razorpay verify)
const createAndProcessPrepaidOrder = async (
  validatedOrderData,
  paymentDetails,
) => {
  const isDigitalOnly = validatedOrderData.items.every(
    (item) => item.isGiftCard,
  );

  const finalOrderData = {
    ...validatedOrderData,
    paymentStatus: "paid",
    paymentDetails: paymentDetails,
    razorpayOrderId: paymentDetails.razorpay_order_id || undefined,
    razorpayPaymentId: paymentDetails.razorpay_payment_id || undefined,
    status: isDigitalOnly ? "Delivered" : "Processing",
    timeline: [
      {
        status: isDigitalOnly ? "Delivered" : "Processing",
        note: isDigitalOnly
          ? "Digital Gift Card delivered successfully"
          : paymentDetails.gateway === "giftcard_bypass"
            ? "Prepaid order confirmed via gift cards"
            : "Payment verified successfully",
      },
    ],
  };

  const order = await Order.create(finalOrderData);

  // Enrich guest profile
  await enrichUserProfileFromOrder(order.userId, order.shippingAddress);

  // 3. Post-creation logic: stock deduction and coupon usage
  await _deductStockForOrder(order.items, order.orderId, order.userId);

  // Platform commission accrual (per-seller ledger entries, status="pending").
  try {
    await accrueCommissionsForOrder(order, {
      triggeredBy: "payment_verified",
      safe: true,
    });
  } catch (e) {
    console.error("[Commission] Accrual hook error:", e.message);
  }

  if (order.couponCode) {
    await Coupon.updateOne(
      { code: order.couponCode, active: true },
      {
        $inc: { usageCount: 1 },
        $push: { usedBy: { userId: order.userId, usedAt: new Date() } },
      },
    );
  }

  // 4. Notify sellers
  const sellerCounts = new Map();
  for (const item of order.items || []) {
    const sid = item?.sellerId ? String(item.sellerId) : "";
    if (!sid) continue;
    sellerCounts.set(
      sid,
      (sellerCounts.get(sid) || 0) + (Number(item.quantity) || 0),
    );
  }
  if (sellerCounts.size > 0) {
    const sellerOrderLink = `/seller/order-details/${order._id}`;
    const docs = Array.from(sellerCounts.entries()).map(([sid, qty]) => ({
      sellerId: sid,
      title: "Payment confirmed",
      message: `Payment received for order ${order.orderId} (${qty} item${qty === 1 ? "" : "s"}).`,
      type: "ORDER",
      priority: "High",
      link: sellerOrderLink,
      isBroadcast: false,
      isRead: false,
    }));
    try {
      await Notification.insertMany(docs);
    } catch (e) {
      /* ignore */
    }
  }

  // Realtime: emit new_order to admin + sellers
  try {
    emitNewOrder(order);
  } catch (e) {
    /* non-blocking */
  }

  // Atomically redeem gift cards
  if (
    Array.isArray(order.appliedGiftCards) &&
    order.appliedGiftCards.length > 0
  ) {
    for (const gc of order.appliedGiftCards) {
      if (!gc.cardId || !gc.amountUsed) continue;
      const updatedCard = await GiftCard.findOneAndUpdate(
        {
          _id: gc.cardId,
          status: { $in: ["active", "partially_used"] },
          balance: { $gte: gc.amountUsed },
        },
        {
          $inc: { balance: -gc.amountUsed },
          $push: {
            redemptions: {
              orderId: order.orderId,
              amountUsed: gc.amountUsed,
              redeemedAt: new Date(),
              redeemedByUserId: order.userId,
            },
          },
        },
        { new: true },
      );
      if (updatedCard) {
        const newStatus =
          updatedCard.balance <= 0
            ? "used"
            : updatedCard.balance < updatedCard.value
              ? "partially_used"
              : "active";
        await GiftCard.updateOne({ _id: gc.cardId }, { status: newStatus });
      } else {
        // Double-spend flag note
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              notes: order.notes
                ? `${order.notes}\n[FLAGGED] Gift card redemption failed for card ${gc.code}`
                : `[FLAGGED] Gift card redemption failed for card ${gc.code}`,
            },
          },
        );
      }
    }
  }

  // Fulfill any purchased gift cards in this order
  try {
    const { fulfillGiftCardsInOrder } = require("./giftCard.controller");
    await fulfillGiftCardsInOrder(order);
  } catch (e) {
    console.error("[GiftCard] Order fulfillment hook error:", e);
  }

  // -- Email: payment success / confirmation --
  const paymentRecipient =
    order.customerEmail ||
    (order.shippingAddress && order.shippingAddress.email);
  if (paymentRecipient) {
    enqueueEmail({
      to: paymentRecipient,
      subject: "Payment Successful - " + order.orderId + " | Swarna Sparsh",
      html: emailTemplates.paymentSuccess({
        order,
        userName: order.customerName,
        paymentId: paymentDetails.razorpay_payment_id || "GIFT_CARD",
      }),
      type: "payment_success",
    });
  }

  // -- Email: seller notification --
  const paySellerMap = new Map();
  for (const item of order.items || []) {
    if (!item.sellerId) continue;
    const k = String(item.sellerId);
    if (!paySellerMap.has(k)) paySellerMap.set(k, []);
    paySellerMap.get(k).push(item);
  }
  if (paySellerMap.size > 0) {
    const paySellerIds = Array.from(paySellerMap.keys());
    const paySellers = await Seller.find({ _id: { $in: paySellerIds } }).select(
      "email shopName fullName",
    );
    for (const seller of paySellers) {
      if (!seller.email) continue;
      enqueueEmail({
        to: seller.email,
        subject: "Payment Confirmed - " + order.orderId + " | Swarna Sparsh",
        html: emailTemplates.sellerNewOrder({
          order,
          sellerName: seller.shopName || seller.fullName,
          sellerItems: paySellerMap.get(String(seller._id)),
        }),
        type: "seller_payment_confirmed",
      });
    }
  }

  return order;
};

// POST /api/user/payment/initiate
exports.initiatePayment = async (req, res) => {
  try {
    const { items, shippingAddress, couponCode, giftCardCodes } = req.body;
    const userId = req.user.userId;
    const userEmail = req.user.email;

    // Calculate order data (this also validates stock and items)
    const orderData = await _calculateOrderData(
      userId,
      userEmail,
      items,
      shippingAddress,
      "razorpay",
      couponCode,
      giftCardCodes,
    );

    if (orderData.total === 0) {
      // Bypass Razorpay entirely for zero-total checkouts
      const order = await createAndProcessPrepaidOrder(orderData, {
        gateway: "giftcard_bypass",
        reason: "Zero total order covered by gift cards",
      });
      return success(
        res,
        { isZeroTotal: true, orderId: order._id },
        "Prepaid order confirmed via gift cards successfully",
      );
    }

    if (!razorpay) {
      if (isPaymentSandboxAllowed()) {
        console.warn(
          "[Razorpay] Credentials not configured in .env. Using test sandbox order.",
        );
        const rpOrder = createSandboxOrder(orderData.orderId, orderData.total);
        return success(
          res,
          { rpOrder, orderData },
          "Test sandbox payment initiated",
        );
      }
      return error(
        res,
        "Payment service is not configured on the server.",
        503,
      );
    }

    let rpOrder;
    try {
      const options = {
        amount: Math.round(orderData.total * 100),
        currency: "INR",
        receipt: orderData.orderId,
      };
      rpOrder = await razorpay.orders.create(options);
    } catch (rpErr) {
      console.error("[Razorpay Order Creation Error]:", rpErr);
      const isAuthError =
        rpErr?.statusCode === 401 ||
        rpErr?.error?.description === "Authentication failed" ||
        rpErr?.error?.code === "BAD_REQUEST_ERROR";

      if (isPaymentSandboxAllowed() && isAuthError) {
        console.warn(
          "[Razorpay] API credentials invalid/expired. Falling back to test sandbox order.",
        );
        rpOrder = createSandboxOrder(orderData.orderId, orderData.total);
      } else {
        const errMsg =
          rpErr?.error?.description ||
          rpErr?.message ||
          "Failed to initiate payment gateway order.";
        return error(
          res,
          `Payment gateway error: ${errMsg}`,
          rpErr?.statusCode || 400,
        );
      }
    }

    // Return both the razorpay order and the calculated data so frontend can pass it back for verification
    return success(res, { rpOrder, orderData }, "Razorpay payment initiated");
  } catch (err) {
    console.error("[initiatePayment error]:", err);
    const errMsg =
      err?.error?.description || err?.message || "Payment initiation failed";
    const isClientError =
      err?.name === "ValidationError" ||
      /stock|not found|unavailable|required|invalid|must contain|variant/i.test(errMsg);
    const statusCode = err?.statusCode || (isClientError ? 400 : 500);
    return error(res, errMsg, statusCode);
  }
};

// POST /api/user/payment/verify
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderData,
    } = req.body;

    if (
      !orderData ||
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return error(res, "Missing payment verification details", 400);
    }

    // 1. Verify Razorpay signature
    const isDevMock =
      isPaymentSandboxAllowed() &&
      (String(razorpay_order_id || "").startsWith("order_dev_") ||
        razorpay_signature === "dev_mock_signature");

    if (!isDevMock) {
      if (!process.env.RAZORPAY_KEY_SECRET) {
        return error(
          res,
          "Payment verification is not configured on the server.",
          503,
        );
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      const isSignatureValid = expectedSignature === razorpay_signature;

      if (!isSignatureValid) {
        return error(
          res,
          "Invalid payment signature",
          400,
          "PAYMENT_SIGNATURE_INVALID",
        );
      }
    }

    // 2. Signature is valid - Now create the order in DB
    // SECURITY FIX: Re-calculate order data on server to prevent frontend tampering
    const userId = req.user.userId;
    const userEmail = req.user.email;
    const items = orderData.items;
    const shippingAddress = orderData.shippingAddress;
    const couponCode = orderData.couponCode;
    const giftCardCodes = orderData.giftCardCodes || [];

    const validatedOrderData = await _calculateOrderData(
      userId,
      userEmail,
      items,
      shippingAddress,
      "razorpay",
      couponCode,
      giftCardCodes,
    );

    const order = await createAndProcessPrepaidOrder(validatedOrderData, {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      gateway: isDevMock ? "razorpay_dev_mock" : "razorpay",
    });

    return success(
      res,
      { order },
      "Payment verified and order created successfully",
    );
  } catch (err) {
    console.error("[verifyPayment error]:", err);
    const errMsg =
      err?.error?.description || err?.message || "Payment verification failed";
    const statusCode =
      err?.statusCode || (err?.name === "ValidationError" ? 400 : 500);
    return error(res, errMsg, statusCode);
  }
};
