const User = require("../../../models/User");
const Address = require("../../../models/Address");
const Notification = require("../../../models/Notification");
const OTP = require("../../../models/OTP");
const SupportTicket = require("../../../models/SupportTicket");
const Review = require("../../../models/Review");
const { success, error } = require("../../../utils/apiResponse");

const buildDeletedPhoneValue = (userId) => `deleted_${String(userId)}_${Date.now()}`;

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return error(res, "User not found", 404);
    return success(res, { user });
  } catch (err) { return error(res, err.message); }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    // Build update payload with allowed fields only to prevent privilege escalation
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      req.user.userId, 
      { $set: updateData }, 
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return error(res, "User not found", 404);
    return success(res, { user }, "Profile updated successfully");
  } catch (err) { 
    // Handle Mongoose duplicate key error (for the unique phone field)
    if (err.code === 11000) {
      return error(res, "Phone number is already in use by another account", 400);
    }
    return error(res, err.message); 
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return error(res, "User not found", 404);

    await Promise.all([
      Address.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      OTP.deleteMany({ phone: user.phone }),
      SupportTicket.deleteMany({ userId }),
      Review.deleteMany({ userId }),
      User.deleteOne({ _id: userId })
    ]);

    return success(res, {}, "Account deleted successfully");
  } catch (err) { return error(res, err.message); }
};
