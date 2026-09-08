const AuditLog = require("../models/AuditLog");

/**
 * Fire-and-forget audit logger.
 * Never throws — a DB write failure must never break an admin action.
 *
 * @param {import("express").Request} req  - Express request (for user, ip, userAgent)
 * @param {Object} opts
 * @param {string}  opts.action       - AuditLog action enum value
 * @param {string}  opts.entity       - AuditLog entity enum value
 * @param {string}  [opts.entityId]   - MongoDB _id of the affected document
 * @param {string}  [opts.entityLabel]- Human-readable name/label
 * @param {*}       [opts.before]     - Snapshot before the change
 * @param {*}       [opts.after]      - Snapshot after the change
 */
const auditLogger = {
  async log(req, { action, entity, entityId = null, entityLabel = "", before = null, after = null }) {
    try {
      const adminId    = req?.user?.userId || req?.user?.id || null;
      const adminEmail = req?.user?.email  || "";

      // Prefer X-Forwarded-For (behind reverse proxy); fall back to socket address
      const ip =
        req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req?.ip ||
        req?.connection?.remoteAddress ||
        "";

      const userAgent = req?.headers?.["user-agent"] || "";

      await AuditLog.create({
        adminId,
        adminEmail,
        action,
        entity,
        entityId:    entityId   ? String(entityId)    : null,
        entityLabel: entityLabel ? String(entityLabel) : "",
        before,
        after,
        ip,
        userAgent,
        timestamp: new Date()
      });
    } catch (err) {
      // Intentionally swallowed — audit failure must not surface to admin
      console.error("[AuditLog] Write failed:", err.message);
    }
  }
};

module.exports = auditLogger;
