const crypto = require("crypto");

const generateOrderId  = () => {
  const len = 6;
  const segment = Array.from(crypto.randomBytes(len))
    .map((b) => SAFE_CHARS[b % SAFE_CHARS.length])
    .join("");
  return `ORD-${segment}`;
};
const generateReturnId = () => `RET-${Math.floor(100000 + Math.random() * 900000)}`;
const generateReplId   = () => `REP-${Math.floor(100000 + Math.random() * 900000)}`;
const generateTicketId = () => `TKT-${Math.floor(100000 + Math.random() * 900000)}`;

/**
 * Generates a unique payout-request reference.
 * Format: PAY-XXXXXXXX-<timestamp>
 */
const generatePayoutId = () => {
  const seg = Array.from(crypto.randomBytes(8))
    .map((b) => SAFE_CHARS[b % SAFE_CHARS.length])
    .join("");
  return `PAY-${seg}-${Date.now()}`;
};

/**
 * Generates a unique wallet-transaction reference.
 * Format: TXN-XXXXXXXX-<timestamp>
 */
const generateTxnId = () => {
  const seg = Array.from(crypto.randomBytes(8))
    .map((b) => SAFE_CHARS[b % SAFE_CHARS.length])
    .join("");
  return `TXN-${seg}-${Date.now()}`;
};

/**
 * Generates a cryptographically unique gift card code.
 * Format: SWARNA-XXXX-XXXX-XXXX  (alphanumeric, uppercase, no ambiguous chars)
 */
const SAFE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
const generateGiftCardCode = () => {
  const segment = (len) =>
    Array.from(crypto.randomBytes(len))
      .map((b) => SAFE_CHARS[b % SAFE_CHARS.length])
      .join("");
  return `SWARNA-${segment(4)}-${segment(4)}-${segment(4)}`;
};

module.exports = { generateOrderId, generateReturnId, generateReplId, generateTicketId, generateGiftCardCode, generatePayoutId, generateTxnId };

