const User = require("../models/User");
const Seller = require("../models/Seller");
const { error } = require("../utils/apiResponse");

const requireActiveUser = async (req, res, next) => {
  try {
    // Allow user, seller, and admin roles through this middleware
    if (!req.user) {
      return error(res, "Forbidden. Authentication required.", 403, "FORBIDDEN");
    }

    if (req.user.role === "seller") {
      const seller = await Seller.findById(req.user.userId).select("status");
      if (!seller) {
        return error(res, "Seller account not found.", 401, "UNAUTHENTICATED");
      }

      if (seller.status !== "APPROVED") {
        const message =
          seller.status === "REJECTED"
            ? "Seller account is rejected. Contact support for assistance."
            : "Seller account is pending approval.";
        return error(res, message, 403, "SELLER_NOT_APPROVED");
      }
    } else {
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
    }

    next();
  } catch (err) {
    return error(res, err.message || "User access check failed", 500, "USER_ACCESS_CHECK_FAILED");
  }
};

module.exports = requireActiveUser;

