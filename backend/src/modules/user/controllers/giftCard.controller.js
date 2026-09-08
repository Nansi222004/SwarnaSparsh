"use strict";

const GiftCard   = require("../../../models/GiftCard");
const User       = require("../../../models/User");
const { success, error } = require("../../../utils/apiResponse");
const { generateGiftCardCode } = require("../../../utils/generateId");
const { enqueueEmail }   = require("../../../services/emailService");
const emailTemplates     = require("../../../services/emailTemplates");

// ── GET /api/user/gift-cards/my-cards ─────────────────────────────────────────
// Lists all gift cards the authenticated user has PURCHASED
exports.getMyGiftCards = async (req, res) => {
  try {
    const cards = await GiftCard.find({ purchasedByUserId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();
    return success(res, { giftCards: cards }, "Gift cards retrieved");
  } catch (err) { return error(res, err.message); }
};

// ── GET /api/user/gift-cards/validate/:code ───────────────────────────────────
// Validates a code and returns its current balance (for checkout UI preview)
exports.validateCode = async (req, res) => {
  try {
    const code = String(req.params.code || "").toUpperCase().trim();
    if (!code) return error(res, "Gift card code is required", 400);

    const card = await GiftCard.findOne({ code }).lean();
    if (!card) return error(res, "Gift card not found or invalid code", 404);

    if (card.status === "disabled") return error(res, "This gift card has been disabled", 400);
    if (card.status === "used")     return error(res, "This gift card has already been fully redeemed", 400);
    if (card.status === "expired")  return error(res, "This gift card has expired", 400);
    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      await GiftCard.updateOne({ _id: card._id }, { status: "expired" });
      return error(res, "This gift card has expired", 400);
    }
    if (card.balance <= 0) return error(res, "This gift card has no remaining balance", 400);

    return success(res, {
      code:    card.code,
      balance: card.balance,
      value:   card.value,
      status:  card.status,
      expiresAt: card.expiresAt,
    }, "Gift card is valid");
  } catch (err) { return error(res, err.message); }
};

// ── POST /api/user/gift-cards/purchase ───────────────────────────────────────
// Called AFTER a successful Razorpay payment for a gift card order.
// Creates the GiftCard document and sends email to recipient.
// NOTE: Only called from payment.controller after verifying payment.
exports.fulfillGiftCardOrder = async (req, res) => {
  try {
    const {
      value, recipientName, recipientEmail, senderName,
      personalMessage, orderId, expiresAt,
    } = req.body;

    if (!value || Number(value) < 500) return error(res, "Gift card minimum value is ₹500", 400);
    if (!recipientName?.trim())  return error(res, "Recipient name is required", 400);
    if (!recipientEmail?.trim()) return error(res, "Recipient email is required", 400);
    if (!senderName?.trim())     return error(res, "Sender name is required", 400);

    const user = await User.findById(req.user.userId).select("name email").lean();

    // Generate unique code
    let code;
    for (let i = 0; i < 5; i++) {
      const candidate = generateGiftCardCode();
      const exists = await GiftCard.exists({ code: candidate });
      if (!exists) { code = candidate; break; }
    }
    if (!code) return error(res, "Failed to generate gift card code. Please contact support.", 500);

    const cardValue = Number(value);
    const card = await GiftCard.create({
      code,
      value:             cardValue,
      balance:           cardValue,
      status:            "active",
      purchasedByUserId: req.user.userId,
      purchasedByName:   user?.name || "",
      purchasedOrderId:  orderId || null,
      recipientName:     recipientName.trim(),
      recipientEmail:    recipientEmail.trim().toLowerCase(),
      senderName:        senderName.trim(),
      personalMessage:   personalMessage?.trim() || "",
      expiresAt:         expiresAt ? new Date(expiresAt) : null,
    });

    // Email to recipient
    enqueueEmail({
      to:      card.recipientEmail,
      subject: `${card.senderName} sent you a ₹${cardValue.toLocaleString("en-IN")} Swarna Sparsh Gift Card! 🎁`,
      html:    emailTemplates.giftCardDelivery({ giftCard: card }),
      type:    "general",
    });

    // Purchase confirmation to buyer
    if (user?.email) {
      enqueueEmail({
        to:      user.email,
        subject: "Your Swarna Sparsh Gift Card Has Been Sent! ✅",
        html:    emailTemplates.giftCardPurchaseConfirmation({ giftCard: card, buyerName: user.name }),
        type:    "general",
      });
    }

    await GiftCard.updateOne({ _id: card._id }, { emailSent: true, emailSentAt: new Date() });

    return success(res, { giftCard: card }, "Gift card created and sent successfully", 201);
  } catch (err) { return error(res, err.message); }
};

// Automates gift card document creation and email delivery when an order with gift card items is paid.
exports.fulfillGiftCardsInOrder = async (order) => {
  try {
    if (!order || !order.items || order.items.length === 0) return;

    for (const item of order.items) {
      if (!item.isGiftCard) continue;

      const p = item.personalization || {};
      const recipientName  = p.recipientName || "Recipient";
      const recipientEmail = p.recipientEmail || "";
      const senderName     = p.senderName || order.customerName || "Swarna Sparsh Customer";
      const personalMessage = p.message || p.personalMessage || "";

      if (!recipientEmail) {
        console.error(`[GiftCard] Missing recipient email for gift card item in order ${order.orderId}`);
        continue;
      }

      // Generate unique code
      let code;
      for (let i = 0; i < 5; i++) {
        const candidate = generateGiftCardCode();
        const exists = await GiftCard.exists({ code: candidate });
        if (!exists) { code = candidate; break; }
      }
      if (!code) {
        console.error(`[GiftCard] Failed to generate code for order ${order.orderId}`);
        continue;
      }

      const cardValue = Number(item.price);
      const card = await GiftCard.create({
        code,
        value:             cardValue,
        balance:           cardValue,
        status:            "active",
        purchasedByUserId: order.userId,
        purchasedByName:   order.customerName || "",
        purchasedOrderId:  order._id,
        recipientName:     recipientName.trim(),
        recipientEmail:    recipientEmail.trim().toLowerCase(),
        senderName:        senderName.trim(),
        personalMessage:   personalMessage.trim(),
        expiresAt:         null, // Gift cards have lifetime validity
      });

      // Email to recipient
      enqueueEmail({
        to:      card.recipientEmail,
        subject: `${card.senderName} sent you a ₹${cardValue.toLocaleString("en-IN")} Swarna Sparsh Gift Card! 🎁`,
        html:    emailTemplates.giftCardDelivery({ giftCard: card }),
        type:    "general",
      });

      // Purchase confirmation to buyer
      if (order.customerEmail) {
        enqueueEmail({
          to:      order.customerEmail,
          subject: "Your Swarna Sparsh Gift Card Has Been Sent! ✅",
          html:    emailTemplates.giftCardPurchaseConfirmation({ giftCard: card, buyerName: order.customerName }),
          type:    "general",
        });
      }

      await GiftCard.updateOne({ _id: card._id }, { emailSent: true, emailSentAt: new Date() });
      console.log(`[GiftCard] Successfully created and emailed gift card ${code} for order ${order.orderId}`);
    }
  } catch (err) {
    console.error("[GiftCard] Error fulfilling gift cards in order:", err);
  }
};
