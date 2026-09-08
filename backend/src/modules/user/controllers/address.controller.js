const Address = require("../../../models/Address");
const { success, error } = require("../../../utils/apiResponse");

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user.userId }).sort({ isDefault: -1, createdAt: -1 });
    return success(res, { addresses }, "Addresses retrieved");
  } catch (err) { return error(res, err.message); }
};

exports.addAddress = async (req, res) => {
  try {
    const data = req.body;
    const userId = req.user.userId;

    // If first address or isDefault is true, unset other defaults
    if (data.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    } else {
      const count = await Address.countDocuments({ userId });
      if (count === 0) data.isDefault = true;
    }

    const address = await Address.create({ ...data, userId });
    return success(res, { address }, "Address added successfully", 201);
  } catch (err) { return error(res, err.message); }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = req.user.userId;

    const address = await Address.findOne({ _id: id, userId });
    if (!address) return error(res, "Address not found", 404);

    if (data.isDefault && !address.isDefault) {
      await Address.updateMany({ userId }, { isDefault: false });
    }

    Object.assign(address, data);
    await address.save();

    return success(res, { address }, "Address updated successfully");
  } catch (err) { return error(res, err.message); }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findOneAndDelete({ _id: id, userId: req.user.userId });
    if (!address) return error(res, "Address not found", 404);

    // If deleted default, set another one as default
    if (address.isDefault) {
      const nextOne = await Address.findOne({ userId: req.user.userId });
      if (nextOne) {
        nextOne.isDefault = true;
        await nextOne.save();
      }
    }

    return success(res, {}, "Address deleted");
  } catch (err) { return error(res, err.message); }
};

exports.setDefault = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await Address.updateMany({ userId }, { isDefault: false });
    const address = await Address.findOneAndUpdate({ _id: id, userId }, { isDefault: true }, { new: true });
    
    if (!address) return error(res, "Address not found", 404);
    return success(res, { address }, "Default address set");
  } catch (err) { return error(res, err.message); }
};
