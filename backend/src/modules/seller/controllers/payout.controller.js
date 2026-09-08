/**
 * Seller Payout Controller — Sands Jewels
 *
 * Endpoints:
 *   GET  /seller/payout/wallet      → wallet balance + totals
 *   GET  /seller/payout/transactions → wallet transaction history
 *   GET  /seller/payout/requests     → seller's own payout requests
 *   POST /seller/payout/request      → create new payout request
 *   DELETE /seller/payout/request/:id → cancel PENDING request (seller)
 */
"use strict";

const mongoose = require("mongoose");
const Seller = require("../../../models/Seller");
const PayoutRequest = require("../../../models/PayoutRequest");
const WalletTransaction = require("../../../models/WalletTransaction");
const { success, error } = require("../../../utils/apiResponse");

const MIN_PAYOUT = 500; // ₹ minimum payout

// ─────────────────────────────────────────────────────────────────────────────
// GET /seller/payout/wallet
// ─────────────────────────────────────────────────────────────────────────────
exports.getWallet = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const seller = await Seller.findById(sellerId)
      .select(
        "walletBalance totalCommissionsEarned totalPaidOut shopName bankAccount",
      )
      .lean();

    if (!seller) return error(res, "Seller not found", 404);

    // Check for any active payout request
    const activePayout = await PayoutRequest.findOne({
      sellerId,
      status: { $in: ["PENDING", "PROCESSING"] },
    })
      .select("payoutId amount status createdAt")
      .lean();

    return success(
      res,
      {
        walletBalance: Math.round(seller.walletBalance || 0),
        totalCommissionsEarned: Math.round(seller.totalCommissionsEarned || 0),
        totalPaidOut: Math.round(seller.totalPaidOut || 0),
        availableForPayout: Math.max(0, Math.round(seller.walletBalance || 0)),
        minPayoutAmount: MIN_PAYOUT,
        canRequestPayout:
          !activePayout && (seller.walletBalance || 0) >= MIN_PAYOUT,
        activePayout: activePayout || null,
        bankAccount: seller.bankAccount || {},
      },
      "Wallet details fetched",
    );
  } catch (err) {
    console.error("[Payout] getWallet:", err.message);
    return error(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /seller/payout/transactions
// ─────────────────────────────────────────────────────────────────────────────
exports.getTransactions = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || "20", 10)),
    );
    const skip = (page - 1) * limit;

    const filter = { sellerId };
    if (
      req.query.type &&
      ["CREDIT", "DEBIT"].includes(req.query.type.toUpperCase())
    ) {
      filter.type = req.query.type.toUpperCase();
    }

    const [transactions, total] = await Promise.all([
      WalletTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WalletTransaction.countDocuments(filter),
    ]);

    return success(
      res,
      {
        transactions,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Transactions fetched",
    );
  } catch (err) {
    console.error("[Payout] getTransactions:", err.message);
    return error(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /seller/payout/requests
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyRequests = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "10", 10)),
    );
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      PayoutRequest.find({ sellerId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PayoutRequest.countDocuments({ sellerId }),
    ]);

    return success(
      res,
      {
        requests,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
      "Payout requests fetched",
    );
  } catch (err) {
    console.error("[Payout] getMyRequests:", err.message);
    return error(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /seller/payout/request
// ─────────────────────────────────────────────────────────────────────────────
exports.createRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sellerId = req.user.userId;
    const { amount, sellerNote } = req.body;

    const amountNum = Math.round(Number(amount));
    if (!amountNum || amountNum < MIN_PAYOUT) {
      await session.abortTransaction();
      session.endSession();
      return error(res, `Minimum payout amount is ₹${MIN_PAYOUT}`, 400);
    }

    // Lock & read seller in transaction
    const seller = await Seller.findById(sellerId)
      .select("walletBalance bankAccount shopName")
      .session(session)
      .lean();

    if (!seller) {
      await session.abortTransaction();
      session.endSession();
      return error(res, "Seller not found", 404);
    }

    const currentBalance = Math.round(seller.walletBalance || 0);

    if (currentBalance < MIN_PAYOUT) {
      await session.abortTransaction();
      session.endSession();
      return error(
        res,
        `Insufficient balance. Minimum required: ₹${MIN_PAYOUT}`,
        400,
      );
    }

    if (amountNum > currentBalance) {
      await session.abortTransaction();
      session.endSession();
      return error(
        res,
        `Amount (₹${amountNum}) exceeds available balance (₹${currentBalance})`,
        400,
      );
    }

    // Check for existing active payout (belt-and-braces alongside unique index)
    const existing = await PayoutRequest.findOne({
      sellerId,
      status: { $in: ["PENDING", "PROCESSING"] },
    })
      .session(session)
      .lean();

    if (existing) {
      await session.abortTransaction();
      session.endSession();
      return error(
        res,
        "You already have an active payout request. Please wait for it to be processed.",
        400,
      );
    }

    // Deduct from wallet
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      { $inc: { walletBalance: -amountNum } },
      { new: true, session, select: "walletBalance" },
    );

    const balanceBefore = currentBalance;
    const balanceAfter = Math.round(updatedSeller.walletBalance);

    // Create payout request
    const [payoutReq] = await PayoutRequest.create(
      [
        {
          sellerId,
          amount: amountNum,
          balanceBefore,
          balanceAfter,
          bankDetails: {
            accountNumber: seller.bankAccount?.accountNumber || "",
            ifscCode: seller.bankAccount?.ifscCode || "",
          },
          sellerNote: sellerNote || "",
          status: "PENDING",
        },
      ],
      { session },
    );

    // Write wallet transaction ledger entry
    const crypto = require("crypto");
    const SAFE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = Array.from(crypto.randomBytes(8))
      .map((b) => SAFE[b % SAFE.length])
      .join("");
    await WalletTransaction.create(
      [
        {
          transactionId: `TXN-${seg}-${Date.now()}`,
          sellerId,
          type: "DEBIT",
          reason: "payout_requested",
          amount: amountNum,
          balanceBefore,
          balanceAfter,
          payoutRequestId: payoutReq._id,
          description: `Payout request ${payoutReq.payoutId} for ₹${amountNum}`,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return success(
      res,
      { payout: payoutReq, newBalance: balanceAfter },
      "Payout request submitted successfully",
      201,
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // Duplicate-key = active payout already exists
    if (err.code === 11000) {
      return error(res, "You already have an active payout request.", 400);
    }

    console.error("[Payout] createRequest:", err.message);
    return error(res, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /seller/payout/request/:id  (cancel PENDING only)
// ─────────────────────────────────────────────────────────────────────────────
exports.cancelRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sellerId = req.user.userId;
    const { id } = req.params;

    const payout = await PayoutRequest.findOne({
      _id: id,
      sellerId,
      status: "PENDING",
    }).session(session);

    if (!payout) {
      await session.abortTransaction();
      session.endSession();
      return error(res, "Payout request not found or cannot be cancelled", 404);
    }

    // Refund the wallet
    const updatedSeller = await Seller.findByIdAndUpdate(
      sellerId,
      { $inc: { walletBalance: payout.amount } },
      { new: true, session, select: "walletBalance" },
    );

    const balanceBefore = Math.round(
      updatedSeller.walletBalance - payout.amount,
    );
    const balanceAfter = Math.round(updatedSeller.walletBalance);

    // Write refund txn
    const crypto = require("crypto");
    const SAFE = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const seg = Array.from(crypto.randomBytes(8))
      .map((b) => SAFE[b % SAFE.length])
      .join("");
    await WalletTransaction.create(
      [
        {
          transactionId: `TXN-${seg}-${Date.now()}`,
          sellerId,
          type: "CREDIT",
          reason: "payout_cancelled",
          amount: payout.amount,
          balanceBefore,
          balanceAfter,
          payoutRequestId: payout._id,
          description: `Payout ${payout.payoutId} cancelled by seller`,
        },
      ],
      { session },
    );

    // Mark as rejected (cancelled by seller shares REJECTED status)
    payout.status = "REJECTED";
    payout.adminNote = "Cancelled by seller";
    payout.processedAt = new Date();
    await payout.save({ session });

    await session.commitTransaction();
    session.endSession();

    return success(
      res,
      { newBalance: balanceAfter },
      "Payout request cancelled and amount refunded",
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("[Payout] cancelRequest:", err.message);
    return error(res, err.message);
  }
};
