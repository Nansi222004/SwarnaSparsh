const Coupon = require("../../../models/Coupon");
const { success, error } = require("../../../utils/apiResponse");

exports.getPublicCoupons = async (req, res) => {
  try {
    const now = new Date();
    const coupons = await Coupon.find({
      active: true,
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ["$usageCount", "$usageLimit"] } }
      ]
    }).sort({ createdAt: -1 });
    return success(res, { coupons }, "Public coupons retrieved successfully");
  } catch (err) {
    return error(res, err.message);
  }
};
