const Coupon = require("../../../models/Coupon");
const { success, error } = require("../../../utils/apiResponse");

const normalizeCouponPayload = (body = {}) => {
  const payload = { ...body };
  payload.code = String(payload.code || "").trim().toUpperCase();
  payload.description = payload.description || "";

  if (payload.type === "free_shipping") {
    payload.value = 0;
    payload.maxDiscount = null;
  }

  if (payload.type !== "percentage") {
    payload.maxDiscount = null;
  }

  if (payload.userEligibility === "new" || payload.applicabilityType === "new_user") {
    payload.userEligibility = "new";
    payload.applicabilityType = "all";
  }

  if (payload.applicabilityType !== "category") {
    payload.applicableCategories = [];
  }

  if (payload.applicabilityType !== "product") {
    payload.applicableProducts = [];
  }

  return payload;
};

exports.createCoupon = async (req, res) => {
  try {
    const payload = normalizeCouponPayload(req.body);
    const existing = await Coupon.findOne({ code: payload.code });
    if (existing) return error(res, "Coupon code already exists", 409);

    const coupon = await Coupon.create(payload);
    return success(res, { coupon }, "Coupon created successfully", 201);
  } catch (err) { return error(res, err.message); }
};

exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return success(res, { coupons });
  } catch (err) { return error(res, err.message); }
};

exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return error(res, "Coupon not found", 404);
    return success(res, { coupon });
  } catch (err) { return error(res, err.message); }
};

exports.updateCoupon = async (req, res) => {
  try {
    const payload = normalizeCouponPayload(req.body);
    const existing = await Coupon.findOne({ code: payload.code, _id: { $ne: req.params.id } });
    if (existing) return error(res, "Coupon code already exists", 409);

    const coupon = await Coupon.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!coupon) return error(res, "Coupon not found", 404);
    return success(res, { coupon }, "Coupon updated successfully");
  } catch (err) { return error(res, err.message); }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return error(res, "Coupon not found", 404);
    return success(res, {}, "Coupon deleted successfully");
  } catch (err) { return error(res, err.message); }
};

exports.toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return error(res, "Coupon not found", 404);
    coupon.active = !coupon.active;
    await coupon.save();
    return success(res, { coupon }, `Coupon ${coupon.active ? "enabled" : "disabled"}`);
  } catch (err) { return error(res, err.message); }
};
