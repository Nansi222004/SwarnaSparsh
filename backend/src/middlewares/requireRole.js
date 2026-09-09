const { error } = require("../utils/apiResponse");

const requireRole = (...args) => async (req, res, next) => {
  try {
    let roles = args;
    let options = {};
    if (args.length > 0 && typeof args[args.length - 1] === "object" && args[args.length - 1] !== null) {
      options = args[args.length - 1];
      roles = args.slice(0, -1);
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, "Forbidden. Insufficient permissions.", 403, "FORBIDDEN");
    }

    next();
  } catch (err) {
    return error(res, err.message || "Authorization check failed", 500, "AUTHZ_CHECK_FAILED");
  }
};

module.exports = requireRole;
