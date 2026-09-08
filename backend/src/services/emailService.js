/**
 * ✉️  Production Email Service — Swarna Sparsh
 *
 *  Features:
 *    - Auto-detects provider: Brevo (preferred), generic SMTP, Mailtrap (dev)
 *    - Retry logic with exponential back-off (3 attempts)
 *    - Email log model for audit trail
 *    - Queue-preparation wrapper (drop-in ready for Bull/BullMQ)
 *    - All templates live in emailTemplates.js
 *
 *  Required .env keys:
 *    SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *    (Optional) BREVO_API_KEY  — if set, sends via Brevo SMTP relay
 *    (Optional) EMAIL_ENABLED=false to completely suppress emails in CI
 */

"use strict";

const nodemailer = require("nodemailer");
const EmailLog = require("../models/EmailLog");

// ── Config ────────────────────────────────────────────────────────────────────

const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== "false";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1500; // ms base delay; doubles each attempt

/**
 * Resolve transporter config from env.
 * Priority: Brevo → explicit SMTP → Mailtrap fallback (dev only)
 */
const resolveTransportConfig = () => {
  // Option 1: Brevo SMTP relay
  if (process.env.BREVO_API_KEY) {
    return {
      host: "smtp-relay.brevo.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_LOGIN || process.env.SMTP_USER,
        pass: process.env.BREVO_API_KEY,
      },
    };
  }

  // Option 2: Generic SMTP (SendGrid, Mailgun, custom, etc.)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const isPlaceholder =
      process.env.SMTP_HOST.includes("yourprovider") ||
      process.env.SMTP_USER.includes("your_smtp") ||
      process.env.SMTP_PASS.includes("your_smtp");

    if (isPlaceholder) {
      console.warn(
        "[Email] ⚠️  SMTP credentials appear to be placeholders. Emails will be silently skipped.",
      );
      return null;
    }

    return {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };
  }

  // Option 3: Mailtrap dev sandbox
  if (process.env.NODE_ENV !== "production") {
    console.info("[Email] 📬 Using Mailtrap sandbox for development.");
    return {
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: process.env.MAILTRAP_USER || "",
        pass: process.env.MAILTRAP_PASS || "",
      },
    };
  }

  return null;
};

const transportConfig = resolveTransportConfig();
const transporter = transportConfig
  ? nodemailer.createTransport(transportConfig)
  : null;

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logEmail = async ({
  to,
  subject,
  type,
  status,
  messageId = null,
  error = null,
}) => {
  try {
    await EmailLog.create({
      to,
      subject,
      type,
      status,
      messageId,
      errorMessage: error,
    });
  } catch (logErr) {
    console.error("[Email] Failed to write email log:", logErr.message);
  }
};

// ── Core send function ────────────────────────────────────────────────────────

/**
 * Send a single email with retry logic.
 *
 * @param {Object} opts
 * @param {string}   opts.to       — Recipient email address
 * @param {string}   opts.subject  — Email subject line
 * @param {string}   opts.html     — HTML body
 * @param {string}   [opts.text]   — Plain-text fallback
 * @param {string}   [opts.type]   — Log category (e.g. "order_confirmation")
 * @param {string[]} [opts.replyTo]
 * @returns {Promise<boolean>}     — true = sent, false = suppressed/failed
 */
const sendEmail = async ({
  to,
  subject,
  html,
  text,
  type = "general",
  replyTo,
} = {}) => {
  if (!EMAIL_ENABLED) {
    console.info(`[Email] Suppressed (EMAIL_ENABLED=false): ${type} → ${to}`);
    return false;
  }

  if (!transporter) {
    console.warn(
      `[Email] No transporter configured — skipping: ${type} → ${to}`,
    );
    await logEmail({ to, subject, type, status: "skipped" });
    return false;
  }

  if (!to || !subject || !html) {
    console.error("[Email] Missing required fields (to, subject, html).");
    return false;
  }

  const mailOptions = {
    from: `Swarna Sparsh <${process.env.SMTP_FROM || "noreply@swarnasparsh.com"}>`,
    to,
    subject,
    html,
    text:
      text ||
      html
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    ...(replyTo ? { replyTo } : {}),
  };

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.info(
        `[Email] ✅ Sent (attempt ${attempt}): ${type} → ${to} | msgId: ${info.messageId}`,
      );
      await logEmail({
        to,
        subject,
        type,
        status: "sent",
        messageId: info.messageId,
      });
      return true;
    } catch (err) {
      lastError = err;
      console.warn(
        `[Email] ⚠️  Attempt ${attempt}/${MAX_RETRIES} failed for ${type} → ${to}: ${err.message}`,
      );
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY * attempt); // exponential back-off
      }
    }
  }

  console.error(
    `[Email] ❌ All ${MAX_RETRIES} attempts failed for ${type} → ${to}:`,
    lastError?.message,
  );
  await logEmail({
    to,
    subject,
    type,
    status: "failed",
    error: lastError?.message,
  });
  return false;
};

// ── Queue-preparation wrapper ─────────────────────────────────────────────────
// When you add Bull/BullMQ, replace the body of enqueueEmail with:
//   emailQueue.add('send', payload, { attempts: 3, backoff: { type: 'exponential', delay: 1500 } })

/**
 * Enqueue an email (currently synchronous; swap body for Bull.add() when ready).
 * All controllers should call this rather than sendEmail directly — it makes
 * migrating to a queue zero-effort.
 */
const enqueueEmail = async (payload) => {
  // Fire-and-forget so it never blocks an API response
  setImmediate(async () => {
    await sendEmail(payload);
  });
};

// ── Verify connection on startup ──────────────────────────────────────────────

const verifyConnection = async () => {
  if (!transporter) return;
  try {
    await transporter.verify();
    console.info("[Email] ✅ SMTP connection verified successfully.");
  } catch (err) {
    console.warn("[Email] ⚠️  SMTP connection check failed:", err.message);
    console.warn(
      "[Email]     Emails may fail silently. Check SMTP credentials in .env",
    );
  }
};

// Run verification on module load (non-blocking)
verifyConnection().catch(() => {});

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = { sendEmail, enqueueEmail };
