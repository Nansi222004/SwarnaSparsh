"use strict";

const GiftCard = require("../../../models/GiftCard");
const { success, error } = require("../../../utils/apiResponse");
const { generateGiftCardCode } = require("../../../utils/generateId");
const { enqueueEmail } = require("../../../services/emailService");
const emailTemplates = require("../../../services/emailTemplates");

const VALID_STATUSES = [
  "pending",
  "active",
  "partially_used",
  "used",
  "expired",
  "disabled",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const parsePositiveInt = (v, fallback) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// ── GET /api/admin/gift-cards ─────────────────────────────────────────────────
exports.getAllGiftCards = async (req, res) => {
  try {
    const {
      status,
      email,
      search,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const safePage = parsePositiveInt(page, 1);
    const safeLimit = Math.min(parsePositiveInt(limit, 20), 100);

    const query = {};
    if (status && VALID_STATUSES.includes(status)) query.status = status;
    if (email)
      query.recipientEmail = { $regex: String(email).trim(), $options: "i" };
    if (search) {
      const escaped = String(search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { code: { $regex: escaped, $options: "i" } },
        { recipientName: { $regex: escaped, $options: "i" } },
        { recipientEmail: { $regex: escaped, $options: "i" } },
        { senderName: { $regex: escaped, $options: "i" } },
        { purchasedOrderId: { $regex: escaped, $options: "i" } },
      ];
    }

    const allowedSort = new Set([
      "createdAt",
      "updatedAt",
      "value",
      "balance",
      "status",
    ]);
    const safeSortBy = allowedSort.has(sortBy) ? sortBy : "createdAt";
    const safeSortOrder = sortOrder === "asc" ? 1 : -1;

    const total = await GiftCard.countDocuments(query);
    const giftCards = await GiftCard.find(query)
      .populate("purchasedByUserId", "name email phone")
      .sort({ [safeSortBy]: safeSortOrder })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    return success(
      res,
      {
        giftCards,
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          pages: Math.ceil(total / safeLimit) || 1,
        },
      },
      "Gift cards retrieved",
    );
  } catch (err) {
    return error(res, err.message);
  }
};

// ── GET /api/admin/gift-cards/:id ─────────────────────────────────────────────
exports.getGiftCardById = async (req, res) => {
  try {
    const card = await GiftCard.findById(req.params.id)
      .populate("purchasedByUserId", "name email phone")
      .populate("redemptions.redeemedByUserId", "name email");
    if (!card) return error(res, "Gift card not found", 404);
    return success(res, { giftCard: card });
  } catch (err) {
    return error(res, err.message);
  }
};

// ── POST /api/admin/gift-cards/issue ─────────────────────────────────────────
// Admin manually issues a gift card (e.g. compensation, promotion)
exports.issueGiftCard = async (req, res) => {
  try {
    const {
      value,
      recipientName,
      recipientEmail,
      senderName,
      personalMessage,
      expiresAt,
      sendEmail: doSendEmail = true,
    } = req.body;

    if (!value || Number(value) < 1)
      return error(res, "Value must be at least ₹1", 400);
    if (!recipientName?.trim())
      return error(res, "Recipient name is required", 400);
    if (!recipientEmail?.trim())
      return error(res, "Recipient email is required", 400);
    if (!senderName?.trim()) return error(res, "Sender name is required", 400);

    // Generate a unique code (retry up to 5 times in case of collision)
    let code;
    for (let i = 0; i < 5; i++) {
      const candidate = generateGiftCardCode();
      const exists = await GiftCard.exists({ code: candidate });
      if (!exists) {
        code = candidate;
        break;
      }
    }
    if (!code)
      return error(
        res,
        "Failed to generate a unique gift card code. Please try again.",
        500,
      );

    const cardValue = Number(value);
    const card = await GiftCard.create({
      code,
      value: cardValue,
      balance: cardValue,
      status: "active",
      purchasedByUserId: null,
      purchasedByName: "Swarna Sparsh (Admin)",
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim().toLowerCase(),
      senderName: senderName.trim(),
      personalMessage: personalMessage?.trim() || "",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    // Send gift card email to recipient
    if (doSendEmail) {
      enqueueEmail({
        to: card.recipientEmail,
        subject: `You've Received a Swarna Sparsh Gift Card worth ₹${cardValue.toLocaleString("en-IN")}!`,
        html: emailTemplates.giftCardDelivery({ giftCard: card }),
        type: "general",
      });
      await GiftCard.updateOne(
        { _id: card._id },
        { emailSent: true, emailSentAt: new Date() },
      );
    }

    return success(
      res,
      { giftCard: card },
      "Gift card issued successfully",
      201,
    );
  } catch (err) {
    return error(res, err.message);
  }
};

// ── PATCH /api/admin/gift-cards/:id/disable ───────────────────────────────────
exports.toggleDisable = async (req, res) => {
  try {
    const card = await GiftCard.findById(req.params.id);
    if (!card) return error(res, "Gift card not found", 404);
    if (card.status === "used")
      return error(res, "Cannot modify a fully used gift card", 400);

    const nextStatus = card.status === "disabled" ? "active" : "disabled";
    card.status = nextStatus;
    await card.save();
    return success(
      res,
      { giftCard: card },
      `Gift card ${nextStatus === "disabled" ? "disabled" : "re-enabled"}`,
    );
  } catch (err) {
    return error(res, err.message);
  }
};

// ── PATCH /api/admin/gift-cards/:id/adjust-balance ───────────────────────────
exports.adjustBalance = async (req, res) => {
  try {
    const { newBalance, reason } = req.body;
    const bal = Number(newBalance);
    if (!Number.isFinite(bal) || bal < 0)
      return error(res, "Balance must be a non-negative number", 400);

    const card = await GiftCard.findById(req.params.id);
    if (!card) return error(res, "Gift card not found", 404);
    if (card.status === "disabled")
      return error(res, "Cannot adjust balance of a disabled card", 400);

    const prevBalance = card.balance;
    card.balance = bal;
    // Reflect balance in status
    if (bal === 0) card.status = "used";
    else if (bal < card.value) card.status = "partially_used";
    else card.status = "active";

    await card.save();
    return success(
      res,
      { giftCard: card },
      `Balance adjusted from ₹${prevBalance} to ₹${bal}`,
    );
  } catch (err) {
    return error(res, err.message);
  }
};

// ── DELETE /api/admin/gift-cards/:id ─────────────────────────────────────────
exports.deleteGiftCard = async (req, res) => {
  try {
    const card = await GiftCard.findById(req.params.id);
    if (!card) return error(res, "Gift card not found", 404);
    if (card.status !== "pending" && card.redemptions.length > 0) {
      return error(
        res,
        "Cannot delete a gift card that has been redeemed. Disable it instead.",
        400,
      );
    }
    await card.deleteOne();
    return success(res, {}, "Gift card deleted");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── POST /api/admin/gift-cards/:id/resend-email ───────────────────────────────
exports.resendEmail = async (req, res) => {
  try {
    const card = await GiftCard.findById(req.params.id);
    if (!card) return error(res, "Gift card not found", 404);

    enqueueEmail({
      to: card.recipientEmail,
      subject: `Your Swarna Sparsh Gift Card — ₹${card.value.toLocaleString("en-IN")}`,
      html: emailTemplates.giftCardDelivery({ giftCard: card }),
      type: "general",
    });
    await GiftCard.updateOne(
      { _id: card._id },
      { emailSent: true, emailSentAt: new Date() },
    );

    return success(res, {}, `Gift card email resent to ${card.recipientEmail}`);
  } catch (err) {
    return error(res, err.message);
  }
};
