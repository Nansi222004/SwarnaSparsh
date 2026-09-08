const mongoose = require("mongoose");
const AuditLog = require("../../../models/AuditLog");
const { success, error } = require("../../../utils/apiResponse");

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(String(v || ""));

// ── GET /api/admin/audit-logs ─────────────────────────────────────────────────
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      entity, action, adminId,
      dateFrom, dateTo, search,
      page = 1, limit = 50
    } = req.query;

    const filter = {};

    if (entity && ["Product", "Seller", "Order", "Settings", "User"].includes(entity)) {
      filter.entity = entity;
    }
    if (action) filter.action = action;
    if (adminId && isValidObjectId(adminId)) filter.adminId = adminId;

    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    if (search) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { adminEmail:   { $regex: escaped, $options: "i" } },
        { entityLabel:  { $regex: escaped, $options: "i" } },
        { entityId:     { $regex: escaped, $options: "i" } },
        { ip:           { $regex: escaped, $options: "i" } }
      ];
    }

    const pageNum  = Math.max(parseInt(page,  10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const skip     = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    return success(res, {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }, "Audit logs retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── GET /api/admin/audit-logs/stats ──────────────────────────────────────────
exports.getAuditStats = async (req, res) => {
  try {
    const now = new Date();

    const startOfDay   = new Date(now); startOfDay.setHours(0,0,0,0);
    const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now); startOfMonth.setDate(1); startOfMonth.setHours(0,0,0,0);

    const [today, week, month] = await Promise.all([
      AuditLog.countDocuments({ timestamp: { $gte: startOfDay } }),
      AuditLog.countDocuments({ timestamp: { $gte: startOfWeek } }),
      AuditLog.countDocuments({ timestamp: { $gte: startOfMonth } })
    ]);

    return success(res, { stats: { today, week, month } }, "Audit stats retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── GET /api/admin/audit-logs/export ─────────────────────────────────────────
exports.exportAuditLogs = async (req, res) => {
  try {
    const {
      entity, action, adminId,
      dateFrom, dateTo, search
    } = req.query;

    const filter = {};
    if (entity) filter.entity = entity;
    if (action) filter.action = action;
    if (adminId && isValidObjectId(adminId)) filter.adminId = adminId;

    if (dateFrom || dateTo) {
      filter.timestamp = {};
      if (dateFrom) filter.timestamp.$gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    if (search) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { adminEmail:  { $regex: escaped, $options: "i" } },
        { entityLabel: { $regex: escaped, $options: "i" } }
      ];
    }

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(5000)
      .lean();

    // Build CSV
    const escapeCell = (v) => {
      const str = v == null ? "" : String(v).replace(/"/g, '""');
      return `"${str}"`;
    };

    const header = ["Timestamp", "Admin Email", "Action", "Entity", "Entity ID", "Entity Label", "IP", "Before", "After"];
    const rows   = logs.map((l) => [
      new Date(l.timestamp).toISOString(),
      l.adminEmail,
      l.action,
      l.entity,
      l.entityId   || "",
      l.entityLabel || "",
      l.ip          || "",
      l.before != null ? JSON.stringify(l.before) : "",
      l.after  != null ? JSON.stringify(l.after)  : ""
    ].map(escapeCell).join(","));

    const csv = [header.join(","), ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="audit-logs-${Date.now()}.csv"`);
    return res.send(csv);
  } catch (err) {
    return error(res, err.message);
  }
};
