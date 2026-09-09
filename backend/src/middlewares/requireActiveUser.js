const User = require("../models/User");
const { error } = require("../utils/apiResponse");

const requireActiveUser = async (req, res, next) => {
  try {
    // Allow user and admin roles through this middleware
    if (!req.user) {
      return error(res, "Forbidden. Authentication required.", 403, "FORBIDDEN");
    }

    // User or Admin
    const user = await User.findById(req.user.userId).select("isBlocked isDeleted");
    if (!user) {
      return error(res, "User not found.", 401, "UNAUTHENTICATED");
    }

    if (user.isDeleted) {
      return error(res, "This account no longer exists.", 401, "ACCOUNT_DELETED");
    }

    // Only look up block-status for regular users
    if (req.user.role === "user") {
      if (user.isBlocked) {
        return error(
          res,
          "Your account has been suspended. Please contact support.",
          403,
          "ACCOUNT_BLOCKED"
        );
      }
    }

    next();
  } catch (err) {
    return error(res, err.message || "User access check failed", 500, "USER_ACCESS_CHECK_FAILED");
  }
};

module.exports = requireActiveUser;

