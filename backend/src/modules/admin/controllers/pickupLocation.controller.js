/**
 * 📦 Admin Pickup Location Controller
 *    Manages Swarna Sparsh store dispatch warehouses and pickup addresses.
 *    Supports creating, updating, setting default, and syncing directly with Shiprocket.
 */

const mongoose = require("mongoose");
const PickupLocation = require("../../../models/PickupLocation");
const Setting = require("../../../models/Setting");
const { success, error } = require("../../../utils/apiResponse");
const { getCourierProvider } = require("../../../services/shipping/courierFactory");

// Helper: sync location to Shiprocket
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

    console.log(`[Admin PickupLocation] Synced "${location.warehouseName}" to Shiprocket. ID: ${result.shiprocketPickupId}`);
    return result;
  } catch (err) {
    location.shiprocket.synced = false;
    location.shiprocket.syncError = err.message;
    await location.save();
    throw err;
  }
}

// ── GET /api/admin/pickup-locations ──────────────────────────────────────────
exports.listPickupLocations = async (req, res) => {
  try {
    // List store locations (sellerId: null or isStoreDefault: true)
    const locations = await PickupLocation.find({
      $or: [{ sellerId: null }, { isStoreDefault: true }],
      isActive: true,
    }).sort({ isDefault: -1, isStoreDefault: -1, createdAt: -1 });

    return success(res, { locations }, "Store pickup locations retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── POST /api/admin/pickup-locations ─────────────────────────────────────────
exports.createPickupLocation = async (req, res) => {
  try {
    const {
      warehouseName, contactPerson, phone, email,
      addressLine1, addressLine2, city, state, pincode, country, isDefault,
    } = req.body;

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

    const trimmedAddress = String(addressLine1 || "").trim();
    if (trimmedAddress.length < 10) {
      return error(res, "Address Line 1 must be at least 10 characters long.", 400);
    }

    // Check if this will be the first location; if so, make it default automatically
    const existingCount = await PickupLocation.countDocuments({
      $or: [{ sellerId: null }, { isStoreDefault: true }],
      isActive: true,
    });
    const makeDefault = Boolean(isDefault || existingCount === 0);

    if (makeDefault) {
      await PickupLocation.updateMany(
        { $or: [{ sellerId: null }, { isStoreDefault: true }] },
        { isDefault: false, isStoreDefault: false }
      );
    }

    const location = await PickupLocation.create({
      sellerId: null,
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
      isDefault: makeDefault,
      isStoreDefault: makeDefault,
    });

    // Background sync to Shiprocket
    _syncToShiprocket(location).catch((syncErr) => {
      console.warn(`[Admin PickupLocation] Shiprocket sync failed for ${location._id}:`, syncErr.message);
    });

    return success(res, { location }, "Store pickup location created", 201);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "A pickup location with that name already exists.", 409);
    }
    return error(res, err.message, 500);
  }
};

// ── GET /api/admin/pickup-locations/:locationId ──────────────────────────────
exports.getPickupLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    return success(res, { location }, "Pickup location retrieved");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── PUT /api/admin/pickup-locations/:locationId ──────────────────────────────
exports.updatePickupLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    const {
      warehouseName, contactPerson, phone, email,
      addressLine1, addressLine2, city, state, pincode, country, isDefault,
    } = req.body;

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

    if (warehouseName) location.warehouseName = warehouseName.trim();
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
      await PickupLocation.updateMany(
        { $or: [{ sellerId: null }, { isStoreDefault: true }], _id: { $ne: locationId } },
        { isDefault: false, isStoreDefault: false }
      );
      location.isDefault = true;
      location.isStoreDefault = true;
    }

    location.shiprocket.synced = false;
    location.shiprocket.syncError = null;
    await location.save();

    _syncToShiprocket(location).catch((syncErr) => {
      console.warn(`[Admin PickupLocation] Shiprocket re-sync failed for ${location._id}:`, syncErr.message);
    });

    return success(res, { location }, "Pickup location updated");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── DELETE /api/admin/pickup-locations/:locationId ───────────────────────────
exports.deletePickupLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    if (location.isDefault || location.isStoreDefault) {
      return error(res, "Cannot delete the default store pickup location. Set another location as default first.", 400);
    }

    location.isActive = false;
    await location.save();

    return success(res, {}, "Pickup location deleted");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── PATCH /api/admin/pickup-locations/:locationId/default ────────────────────
exports.setDefaultPickupLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    await PickupLocation.updateMany(
      { $or: [{ sellerId: null }, { isStoreDefault: true }] },
      { isDefault: false, isStoreDefault: false }
    );

    location.isDefault = true;
    location.isStoreDefault = true;
    await location.save();

    return success(res, { location }, "Default store pickup location updated");
  } catch (err) {
    return error(res, err.message);
  }
};

// ── POST /api/admin/pickup-locations/:locationId/sync-shiprocket ─────────────
exports.syncWithShiprocket = async (req, res) => {
  try {
    const { locationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(locationId)) {
      return error(res, "Invalid location ID", 400);
    }

    const location = await PickupLocation.findOne({ _id: locationId, isActive: true });
    if (!location) return error(res, "Pickup location not found", 404);

    await _syncToShiprocket(location);

    return success(res, { location }, "Pickup location synced with Shiprocket successfully");
  } catch (err) {
    return error(res, err.message, 500);
  }
};
