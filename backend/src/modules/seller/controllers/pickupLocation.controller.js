/**
 * 📦 Seller Pickup Location Controller
 *    Sellers manage their own pickup addresses.
 *    Creates locally, then syncs to Shiprocket.
 */

const mongoose = require("mongoose");
const PickupLocation = require("../../../models/PickupLocation");
const Seller = require("../../../models/Seller");
const { success, error } = require("../../../utils/apiResponse");
const { getCourierProvider } = require("../../../services/shipping/courierFactory");

// ── List seller's pickup locations ───────────────────────────────────────────

exports.listPickupLocations = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const locations = await PickupLocation.find({ sellerId, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
    return success(res, { locations }, "Pickup locations retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── Create a new pickup location ─────────────────────────────────────────────

exports.createPickupLocation = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const {
      warehouseName, contactPerson, phone, email,
      addressLine1, addressLine2, city, state, pincode, country, isDefault,
    } = req.body;

    // Basic validation
    if (!warehouseName || !contactPerson || !phone || !addressLine1 || !city || !state || !pincode) {
      return error(res, "Required fields: warehouseName, contactPerson, phone, addressLine1, city, state, pincode", 400);
    }

    if (!/^\d{10}$/.test(String(phone).trim())) {
      return error(res, "Phone number must be exactly 10 digits", 400);
    }
    if (!/^[A-Za-z\s]+$/.test(String(city).trim())) {
      return error(res, "City should contain only alphabets", 400);
    }
    if (!/^[A-Za-z\s]+$/.test(String(state).trim())) {
      return error(res, "State should contain only alphabets", 400);
    }
    if (!/^\d{6}$/.test(String(pincode).trim())) {
      return error(res, "Pincode must be exactly 6 digits", 400);
    }

    const trimmedAddress = String(addressLine1 || '').trim();
    if (trimmedAddress.length < 10) {
      return error(res, "Address Line 1 must be at least 10 characters long.", 400);
    }
    const hasDigits = /\d/.test(trimmedAddress);
    const hasAddressKeywords = /(road|plot|house|flat|building|bldg|no|floor|block|ward|street|st|lane|society|apartments|apt)/i.test(trimmedAddress);
    if (!hasDigits && !hasAddressKeywords) {
      return error(res, "Address Line 1 must contain a house number, flat number, road name, or plot number (e.g. Flat 101 or Road No. 5).", 400);
    }

    // If this is flagged as default, unset other defaults for this seller
    if (isDefault) {
      await PickupLocation.updateMany({ sellerId }, { isDefault: false });
    }

    // Check for duplicate name
    const existing = await PickupLocation.findOne({ sellerId, warehouseName: warehouseName.trim() });
    if (existing) {
      return error(res, `A pickup location named "${warehouseName}" already exists.`, 409);
    }

    // Create locally first
    const location = await PickupLocation.create({
      sellerId,
      warehouseName: warehouseName.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email?.trim() || "",
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2?.trim() || "",
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country || "India",
      isDefault: !!isDefault,
    });

    // Sync to Shiprocket (non-blocking – failure doesn't abort creation)
    _syncToShiprocket(location).catch((syncErr) => {
      console.warn(`[PickupLocation] Shiprocket sync failed for ${location._id}:`, syncErr.message);
    });

    // If default, update seller's shiprocketConfig
    if (isDefault) {
      await Seller.findByIdAndUpdate(sellerId, {
        "shiprocketConfig.defaultPickupLocationId": location._id,
      });
    }

    return success(res, { location }, "Pickup location created. Syncing with Shiprocket in background.", 201);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "A pickup location with that name already exists.", 409);
    }
    console.error("[PickupLocation] Create failed:", err.message);
    return error(res, err.message, 500);
  }
};

// ── Get a single pickup location ─────────────────────────────────────────────

exports.getPickupLocation = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { locationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, sellerId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    return success(res, { location }, "Pickup location retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── Update a pickup location ─────────────────────────────────────────────────

exports.updatePickupLocation = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { locationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, sellerId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    const {
      contactPerson, phone, email,
      addressLine1, addressLine2, city, state, pincode, country, isDefault,
    } = req.body;

    // Validate inputs if provided
    if (phone !== undefined && !/^\d{10}$/.test(String(phone).trim())) {
      return error(res, "Phone number must be exactly 10 digits", 400);
    }
    if (city !== undefined && !/^[A-Za-z\s]+$/.test(String(city).trim())) {
      return error(res, "City should contain only alphabets", 400);
    }
    if (state !== undefined && !/^[A-Za-z\s]+$/.test(String(state).trim())) {
      return error(res, "State should contain only alphabets", 400);
    }
    if (pincode !== undefined && !/^\d{6}$/.test(String(pincode).trim())) {
      return error(res, "Pincode must be exactly 6 digits", 400);
    }

    if (addressLine1 !== undefined) {
      const trimmedAddress = String(addressLine1 || '').trim();
      if (trimmedAddress.length < 10) {
        return error(res, "Address Line 1 must be at least 10 characters long.", 400);
      }
      const hasDigits = /\d/.test(trimmedAddress);
      const hasAddressKeywords = /(road|plot|house|flat|building|bldg|no|floor|block|ward|street|st|lane|society|apartments|apt)/i.test(trimmedAddress);
      if (!hasDigits && !hasAddressKeywords) {
        return error(res, "Address Line 1 must contain a house number, flat number, road name, or plot number (e.g. Flat 101 or Road No. 5).", 400);
      }
    }

    // Apply updates
    if (contactPerson) location.contactPerson = contactPerson.trim();
    if (phone) location.phone = phone.trim();
    if (email !== undefined) location.email = email.trim();
    if (addressLine1) location.addressLine1 = addressLine1.trim();
    if (addressLine2 !== undefined) location.addressLine2 = addressLine2.trim();
    if (city) location.city = city.trim();
    if (state) location.state = state.trim();
    if (pincode) location.pincode = pincode.trim();
    if (country) location.country = country;

    if (isDefault === true) {
      await PickupLocation.updateMany({ sellerId, _id: { $ne: locationId } }, { isDefault: false });
      location.isDefault = true;
      await Seller.findByIdAndUpdate(sellerId, {
        "shiprocketConfig.defaultPickupLocationId": location._id,
      });
    }

    // Mark Shiprocket as needing re-sync
    location.shiprocket.synced = false;
    location.shiprocket.syncError = null;
    await location.save();

    // Re-sync with Shiprocket
    _syncToShiprocket(location).catch((syncErr) => {
      console.warn(`[PickupLocation] Shiprocket re-sync failed for ${location._id}:`, syncErr.message);
    });

    return success(res, { location }, "Pickup location updated");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── Delete (soft-delete) a pickup location ────────────────────────────────────

exports.deletePickupLocation = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { locationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, sellerId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    if (location.isDefault) {
      return error(res, "Cannot delete the default pickup location. Set another location as default first.", 400);
    }

    location.isActive = false;
    await location.save();

    return success(res, {}, "Pickup location deleted");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── Set default pickup location ───────────────────────────────────────────────

exports.setDefaultPickupLocation = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { locationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, sellerId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    // Unset all, then set the target
    await PickupLocation.updateMany({ sellerId }, { isDefault: false });
    location.isDefault = true;
    await location.save();

    // Update seller preference
    await Seller.findByIdAndUpdate(sellerId, {
      "shiprocketConfig.defaultPickupLocationId": location._id,
    });

    return success(res, { location }, "Default pickup location updated");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── Manual Shiprocket sync ────────────────────────────────────────────────────

exports.syncWithShiprocket = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { locationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, sellerId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    await _syncToShiprocket(location);

    return success(res, { location }, "Pickup location synced with Shiprocket");
  } catch (err) {
    return error(res, err.message, 500);
  }
};

// ── Internal: sync to Shiprocket ─────────────────────────────────────────────

async function _syncToShiprocket(location) {
  try {
    const provider = getCourierProvider("shiprocket");
    const result = await provider.createPickupLocation({
      warehouseName: location.warehouseName,
      contactPerson: location.contactPerson,
      phone: location.phone,
      email: location.email,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2,
      city: location.city,
      state: location.state,
      pincode: location.pincode,
      country: location.country,
    });

    location.shiprocket.pickupName = location.warehouseName;
    location.shiprocket.pickupId = result.shiprocketPickupId || null;
    location.shiprocket.synced = true;
    location.shiprocket.syncedAt = new Date();
    location.shiprocket.syncError = null;
    await location.save();

    console.log(`[PickupLocation] Synced "${location.warehouseName}" to Shiprocket. ID: ${result.shiprocketPickupId}`);
  } catch (err) {
    location.shiprocket.synced = false;
    location.shiprocket.syncError = err.message;
    await location.save();
    throw err;
  }
}
