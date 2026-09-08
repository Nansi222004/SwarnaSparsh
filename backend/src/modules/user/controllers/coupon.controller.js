const Coupon = require("../../../models/Coupon");
const Order = require("../../../models/Order");
const { success, error } = require("../../../utils/apiResponse");

const toIdSet = (values = []) =>
  new Set((Array.isArray(values) ? values : []).map((value) => String(value)));

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

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
    }).select("code type value minOrderValue maxDiscount description validUntil active");

    return success(res, { coupons }, "Active coupons retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, cartTotal, items } = req.body;
    const userId = req.user.userId;
    const normalizedCode = String(code || "").trim().toUpperCase();

    if (!normalizedCode) {
      return error(res, "Coupon code is required", 400);
    }

    const coupon = await Coupon.findOne({ code: normalizedCode, active: true });

    if (!coupon) return error(res, "Invalid or expired coupon code", 400);

    const now = new Date();
    if (coupon.validFrom && now < coupon.validFrom) return error(res, "Coupon not yet active", 400);
    if (coupon.validUntil && now > coupon.validUntil) return error(res, "Coupon expired", 400);

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return error(res, "Coupon usage limit reached", 400);
    }

    const userUsage = coupon.usedBy.filter((u) => u.userId.toString() === String(userId)).length;
    if (userUsage >= coupon.perUserLimit) return error(res, "You have already used this coupon", 400);

    if (coupon.userEligibility === "new") {
      const priorOrders = await Order.countDocuments({ userId, paymentStatus: "paid" });
      if (priorOrders > 0) return error(res, "This coupon is only for first-time customers", 400);
    }

    let isApplicable = true;
    let applicableItems = Array.isArray(items) ? items : [];

    if (coupon.applicabilityType !== "all") {
      isApplicable = false;
      if (!Array.isArray(items) || items.length === 0) {
        return error(res, "Cart items required for validation", 400);
      }

      const categoryIdSet = toIdSet(coupon.applicableCategories);
      const productIdSet = toIdSet(coupon.applicableProducts);

      applicableItems = items.filter((item) => {
        const itemCategoryId = String(item?.categoryId || "");
        const itemProductId = String(item?.productId || item?.id || "");

        if (coupon.applicabilityType === "category") {
          return categoryIdSet.has(itemCategoryId);
        }
        if (coupon.applicabilityType === "product") {
          return productIdSet.has(itemProductId);
        }
        return false;
      });

      if (applicableItems.length > 0) isApplicable = true;
    }

    if (!isApplicable) return error(res, "Coupon not applicable to items in your cart", 400);

    const applicableTotal =
      coupon.applicabilityType === "all"
        ? toNumber(cartTotal, 0)
        : applicableItems.reduce(
            (acc, item) => acc + toNumber(item?.price, 0) * toNumber(item?.quantity, 0),
            0
          );

    if (applicableTotal < coupon.minOrderValue) {
      return error(res, `Minimum value of Rs ${coupon.minOrderValue} required for applicable items`, 400);
    }

    let discount = 0;
    if (coupon.type === "flat") {
      discount = coupon.value;
    } else if (coupon.type === "percentage") {
      discount = Math.round((applicableTotal * coupon.value) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
    } else if (coupon.type === "free_shipping") {
      discount = 0;
    }

    discount = Math.min(discount, applicableTotal);

    return success(
      res,
      {
        code: coupon.code,
        discount,
        type: coupon.type,
        value: coupon.value,
        isFreeShipping: coupon.type === "free_shipping"
      },
      "Coupon applied successfully"
    );
  } catch (err) {
    console.error("Coupon Validation Error:", err);
    return error(res, err.message);
  }
};
